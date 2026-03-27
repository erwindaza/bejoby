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

    // Build query — avoid composite index requirements by filtering in JS
    // Only use Firestore where() for single-field filters that don't need orderBy
    let query: Query = jobs();

    if (employer_id) query = query.where("employer_id", "==", employer_id);

    const snapshot = await query.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Client-side filtering (avoids Firestore composite index requirements)
    if (status) data = data.filter((d) => d.status === status);
    if (language) data = data.filter((d) => d.language === language);
    if (work_mode) data = data.filter((d) => d.work_mode === work_mode);

    // Sort by created_at desc (newest first)
    data.sort((a, b) => {
      const ta = a.created_at?._seconds ?? 0;
      const tb = b.created_at?._seconds ?? 0;
      return tb - ta;
    });

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
