// src/app/api/applications/route.ts
import { applications, jobs, candidates } from "@/lib/gcp/collections";
import { createApplicationSchema } from "@/lib/validators/application";
import { created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { notifyApplicationReceived } from "@/lib/email";

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
    }).catch(() => {});

    return created({ id: docRef.id, ...parsed.data, status: "pending" });
  } catch (err) {
    console.error("[POST /api/applications]", err);
    return serverError();
  }
}
