// src/app/api/applications/route.ts
import { applications, jobs, candidates } from "@/lib/gcp/collections";
import { createApplicationSchema } from "@/lib/validators/application";
import { success, created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { notifyApplicationReceived } from "@/lib/email";
import { getSessionUser } from "@/lib/auth";
import { buildEmployerSafeApplicationView, decryptCandidatePII, encryptApplicationPII } from "@/lib/security/pii";

// GET /api/applications — List applications (candidate-only view)
// NOTE: Employer view moved to GET /api/employer/job-postings/[id]/applications
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return error("Unauthorized", 401);
    }

    // Candidate listing their own applications
    if (!user.employer_id) {
      const candidateId = user.id;
      const limit = 100;

      // Get candidate's applications (ordered by submission date, newest first)
      const snap = await applications()
        .where("candidate_id", "==", candidateId)
        .orderBy("created_at", "desc")
        .limit(limit)
        .get();

      const jobIds = [...new Set(snap.docs.map((doc) => String(doc.data().job_id || "")))].filter(Boolean);
      const jobMap = new Map<string, Record<string, unknown>>();
      for (let i = 0; i < jobIds.length; i += 30) {
        const chunk = jobIds.slice(i, i + 30);
        if (chunk.length === 0) continue;
        const jobSnap = await jobs().where("__name__", "in", chunk).get();
        jobSnap.docs.forEach((d) => jobMap.set(d.id, d.data()));
      }

      const apps = snap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const job = jobMap.get(String(data.job_id || ""));
        return {
          id: doc.id,
          job_id: data.job_id,
          job_title: job?.title || data.job_id,
          company_display: job?.company_display || "",
          candidate_id: data.candidate_id,
          status: data.status || "pending",
          created_at: data.created_at,
          updated_at: data.updated_at,
          cv_path: data.cv_path,
          consent_share_data: data.consent_share_data,
        };
      });

      return success({
        applications: apps,
        total: apps.length,
        limit,
      });
    }

    // Employer view: Get applications to their jobs (EXISTING LOGIC)
    const jobSnap = await jobs().where("employer_id", "==", user.employer_id).get();
    if (jobSnap.empty) return success({ applications: [], total: 0 });

    const jobIds = jobSnap.docs.map((d) => d.id);
    const jobMap = new Map(jobSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

    const chunks: string[][] = [];
    for (let i = 0; i < jobIds.length; i += 30) {
      chunks.push(jobIds.slice(i, i + 30));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allApps: any[] = [];
    for (const chunk of chunks) {
      const snap = await applications().where("job_id", "in", chunk).get();
      for (const doc of snap.docs) {
        const data = doc.data() as Record<string, unknown>;
        const jobId = String(data.job_id || "");
        const job = jobMap.get(jobId);
        const safeApp = buildEmployerSafeApplicationView(doc.id, data);
        allApps.push({
          ...safeApp,
          job_title: (job as Record<string, unknown>)?.title || jobId,
        });
      }
    }

    allApps.sort((a, b) => {
      const ta = a.created_at?._seconds ?? 0;
      const tb = b.created_at?._seconds ?? 0;
      return tb - ta;
    });

    return success({
      applications: allApps,
      total: allApps.length,
    });
  } catch (err) {
    console.error("[GET /api/applications]", err);
    return serverError();
  }
}

// POST /api/applications — Apply to a job
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    // Verify job exists and is published
    const jobDoc = await jobs().doc(parsed.data.job_id).get();
    if (!jobDoc.exists) return error("Job not found", 404);
    if (jobDoc.data()?.status !== "published") return error("Job is not accepting applications");

    // Verify candidate exists
    const candidateDoc = await candidates().doc(parsed.data.candidate_id).get();
    if (!candidateDoc.exists) return error("Candidate not found", 404);
    const candidateData = decryptCandidatePII(candidateDoc.data() as Record<string, unknown>);

    // Check for duplicate application
    const existing = await applications()
      .where("job_id", "==", parsed.data.job_id)
      .where("candidate_id", "==", parsed.data.candidate_id)
      .limit(1)
      .get();
    if (!existing.empty) return error("Already applied to this job", 409);

    const docRef = applications().doc();
    await docRef.set({
      job_id: parsed.data.job_id,
      candidate_id: parsed.data.candidate_id,
      consent_share_data: parsed.data.consent_share_data,
      cv_path: parsed.data.cv_path || "",
      cv_filename: parsed.data.cv_filename || "",
      ...encryptApplicationPII({
        candidate_name: parsed.data.candidate_name,
        candidate_email: parsed.data.candidate_email,
        resume_url: parsed.data.resume_url,
        message: parsed.data.message,
      }),
      status: "pending",
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    // Fire-and-forget email notification
    const jobData = jobDoc.data();
    notifyApplicationReceived({
      id: docRef.id,
      job_id: parsed.data.job_id,
      job_title: jobData?.title || "(sin título)",
      candidate_name: String(candidateData.name || parsed.data.candidate_name),
      candidate_email: String(candidateData.email || parsed.data.candidate_email),
      message: parsed.data.message,
      cv_filename: parsed.data.cv_filename || undefined,
    }).catch(() => {});

    return created({
      id: docRef.id,
      job_id: parsed.data.job_id,
      candidate_id: parsed.data.candidate_id,
      status: "pending",
      application_pii_encrypted: true,
    });
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return serverError();
  }
}
