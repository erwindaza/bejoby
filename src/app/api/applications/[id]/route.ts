// src/app/api/applications/[id]/route.ts
import { applications, jobs, interactions } from "@/lib/gcp/collections";
import { updateApplicationSchema } from "@/lib/validators/application";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { analyzeApplication } from "@/lib/ai/match-analysis";
import { sendAnalysisReport } from "@/lib/email";
import { getSessionUser } from "@/lib/auth";
import { buildEmployerSafeApplicationView, decryptApplicationPII } from "@/lib/security/pii";

type Params = { params: Promise<{ id: string }> };

// GET /api/applications/:id — Get application details (candidate or employer view)
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) return error("Unauthorized", 401);

    const doc = await applications().doc(id).get();
    if (!doc.exists) return notFound("Application");

    const appData = doc.data() as Record<string, unknown>;
    const candidateId = String(appData.candidate_id || "");
    const jobId = String(appData.job_id || "");

    // Check access: candidate can view own app, employer can view apps to their jobs
    let isAuthorized = false;

    // Case 1: Candidate viewing own application
    if (candidateId === user.id && !user.employer_id) {
      isAuthorized = true;
    }

    // Case 2: Employer viewing application to their jobs
    if (user.employer_id && jobId) {
      const jobDoc = await jobs().doc(jobId).get();
      if (jobDoc.exists) {
        const jobData = jobDoc.data() as Record<string, unknown>;
        if (jobData.employer_id === user.employer_id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return error("Forbidden", 403);
    }

    // Fetch interactions (candidate: public only, employer: all)
    const interactionsList = await interactions()
      .where("application_id", "==", id)
      .orderBy("created_at", "asc")
      .get();

    const interactionsData = interactionsList.docs
      .filter((doc) => {
        const data = doc.data();
        // Candidate only sees public interactions
        if (candidateId === user.id) {
          return data.is_public === true;
        }
        // Employer sees all
        return true;
      })
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    // Candidate view: return base application + public interactions
    if (candidateId === user.id) {
      return success({
        application: doc.data(),
        interactions: interactionsData,
      });
    }

    // Employer view: return sanitized view
    return success({
      application: buildEmployerSafeApplicationView(doc.id, appData),
      interactions: interactionsData,
    });
  } catch (err) {
    console.error("[GET /api/applications/:id]", err);
    return serverError();
  }
}

// PUT /api/applications/:id — Update application status (employer only)
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || !user.employer_id) return error("Unauthorized", 401);

    const doc = await applications().doc(id).get();
    if (!doc.exists) return notFound("Application");

    const appData = doc.data() as Record<string, unknown>;
    const jobId = String(appData.job_id || "");

    // Verify employer owns the job
    const jobDoc = await jobs().doc(jobId).get();
    if (!jobDoc.exists) return notFound("Job");
    const jobData = jobDoc.data() as Record<string, unknown>;
    if (jobData.employer_id !== user.employer_id) {
      return error("Forbidden", 403);
    }

    const body = await req.json().catch(() => null);
    const parsed = updateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    await applications().doc(id).update({
      ...parsed.data,
      updated_at: FieldValue.serverTimestamp(),
    });

    return success({ id, status: parsed.data.status });
  } catch (err) {
    console.error("[PUT /api/applications/:id]", err);
    return serverError();
  }
}

// PATCH /api/applications/:id — Partial update (e.g. attach CV info)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await applications().doc(id).get();
    if (!doc.exists) return notFound("Application");

    const body = await req.json().catch(() => null);
    if (!body) return error("Invalid request body");

    // Only allow updating specific fields
    const allowed: Record<string, unknown> = {};
    if (typeof body.cv_path === "string") allowed.cv_path = body.cv_path;
    if (typeof body.cv_filename === "string") allowed.cv_filename = body.cv_filename;

    if (Object.keys(allowed).length === 0) {
      return error("Nothing to update");
    }

    await applications().doc(id).update({
      ...allowed,
      updated_at: FieldValue.serverTimestamp(),
    });

    // Fire-and-forget: if CV was just attached, run AI analysis
    if (allowed.cv_path) {
      (async () => {
        try {
          const analysis = await analyzeApplication(id);
          if (analysis) {
            // Fetch updated application data for the email
            const updatedDoc = await applications().doc(id).get();
            const appData = updatedDoc.data();
            if (appData) {
              const decrypted = decryptApplicationPII(appData as Record<string, unknown>);
              // Fetch job title
              const jobDoc = await jobs().doc(appData.job_id).get();
              const jobTitle = jobDoc.exists ? jobDoc.data()?.title || appData.job_id : appData.job_id;

              await sendAnalysisReport({
                candidate_name: String(decrypted.candidate_name || ""),
                candidate_email: String(decrypted.candidate_email || ""),
                job_title: jobTitle,
                job_id: appData.job_id,
                cv_filename: appData.cv_filename || "",
                analysis,
              });
            }
          }
        } catch (err) {
          console.error("[PATCH] AI analysis fire-and-forget error:", err);
        }
      })();
    }

    return success({ id, ...allowed });
  } catch (err) {
    console.error("[PATCH /api/applications/:id]", err);
    return serverError();
  }
}
