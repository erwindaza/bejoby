// src/app/api/jobs/route.ts
import { jobs } from "@/lib/gcp/collections";
import { createJobSchema } from "@/lib/validators/job";
import { success, created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue, Query } from "@google-cloud/firestore";

// GET /api/jobs — List jobs with optional filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const language = searchParams.get("language");
    const employer_id = searchParams.get("employer_id");
    const work_mode = searchParams.get("work_mode");

    let query: Query = jobs().orderBy("created_at", "desc");

    if (status) query = query.where("status", "==", status);
    if (language) query = query.where("language", "==", language);
    if (employer_id) query = query.where("employer_id", "==", employer_id);
    if (work_mode) query = query.where("work_mode", "==", work_mode);

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return success(data);
  } catch (err) {
    console.error("[GET /api/jobs]", err);
    return serverError();
  }
}

// POST /api/jobs — Create a new job
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const docRef = jobs().doc();
    await docRef.set({
      ...parsed.data,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return created({ id: docRef.id, ...parsed.data });
  } catch (err) {
    console.error("[POST /api/jobs]", err);
    return serverError();
  }
}
