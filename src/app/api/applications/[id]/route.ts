// src/app/api/applications/[id]/route.ts
import { applications, jobs } from "@/lib/gcp/collections";
import { updateApplicationSchema } from "@/lib/validators/application";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { analyzeApplication } from "@/lib/ai/match-analysis";
import { sendAnalysisReport } from "@/lib/email";
import { getSessionUser } from "@/lib/auth";
import { buildEmployerSafeApplicationView, decryptApplicationPII } from "@/lib/security/pii";

type Params = { params: Promise<{ id: string }> };

async function assertEmployerOwnsApplication(applicationId: string) {
  const user = await getSessionUser();
  if (!user || !user.employer_id) return { errorResponse: error("Unauthorized", 401) };

  const doc = await applications().doc(applicationId).get();
  if (!doc.exists) return { errorResponse: notFound("Application") };

  const appData = doc.data() as Record<string, unknown>;
  const jobDoc = await jobs().doc(String(appData.job_id || "")).get();
  if (!jobDoc.exists) return { errorResponse: notFound("Job") };
  const jobData = jobDoc.data() as Record<string, unknown>;
  if (jobData.employer_id !== user.employer_id) {
    return { errorResponse: error("Forbidden", 403) };
  }

  return { user, doc, appData, jobDoc, jobData };
}

// GET /api/applications/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const access = await assertEmployerOwnsApplication(id);
    if ("errorResponse" in access) return access.errorResponse;

    return success(buildEmployerSafeApplicationView(access.doc.id, access.appData));
  } catch (err) {
    console.error("[GET /api/applications/:id]", err);
    return serverError();
  }
}

// PUT /api/applications/:id — Update application status
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const access = await assertEmployerOwnsApplication(id);
    if ("errorResponse" in access) return access.errorResponse;

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
