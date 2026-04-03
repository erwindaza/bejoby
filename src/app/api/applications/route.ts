// src/app/api/applications/route.ts
import { applications, jobs, candidates } from "@/lib/gcp/collections";
import { createApplicationSchema } from "@/lib/validators/application";
import { success, created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { notifyApplicationReceived } from "@/lib/email";
import { getSessionUser } from "@/lib/auth";

// GET /api/applications — List applications for employer's jobs
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !user.employer_id) {
      return error("Unauthorized", 401);
    }

    // 1. Get all jobs belonging to this employer
    const jobSnap = await jobs().where("employer_id", "==", user.employer_id).get();
    if (jobSnap.empty) return success([]);

    const jobIds = jobSnap.docs.map((d) => d.id);
    const jobMap = new Map(jobSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

    // 2. Fetch applications for those jobs (Firestore 'in' supports max 30)
    const chunks: string[][] = [];
    for (let i = 0; i < jobIds.length; i += 30) {
      chunks.push(jobIds.slice(i, i + 30));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allApps: any[] = [];
    for (const chunk of chunks) {
      const snap = await applications().where("job_id", "in", chunk).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        const job = jobMap.get(data.job_id);
        allApps.push({
          id: doc.id,
          ...data,
          job_title: (job as Record<string, unknown>)?.title || data.job_id,
        });
      }
    }

    // Sort by created_at desc
    allApps.sort((a, b) => {
      const ta = a.created_at?._seconds ?? 0;
      const tb = b.created_at?._seconds ?? 0;
      return tb - ta;
    });

    return success(allApps);
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

    // Check for duplicate application
    const existing = await applications()
      .where("job_id", "==", parsed.data.job_id)
      .where("candidate_id", "==", parsed.data.candidate_id)
      .limit(1)
      .get();
    if (!existing.empty) return error("Already applied to this job", 409);

    const docRef = applications().doc();
    await docRef.set({
      ...parsed.data,
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
      candidate_name: parsed.data.candidate_name,
      candidate_email: parsed.data.candidate_email,
      message: parsed.data.message,
      cv_filename: parsed.data.cv_filename || undefined,
    }).catch(() => {});

    return created({ id: docRef.id, ...parsed.data, status: "pending" });
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return serverError();
  }
}
