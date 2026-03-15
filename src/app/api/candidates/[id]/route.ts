// src/app/api/candidates/[id]/route.ts
import { candidates } from "@/lib/gcp/collections";
import { updateCandidateSchema } from "@/lib/validators/candidate";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";

type Params = { params: Promise<{ id: string }> };

// GET /api/candidates/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await candidates().doc(id).get();
    if (!doc.exists) return notFound("Candidate");
    return success({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("[GET /api/candidates/:id]", err);
    return serverError();
  }
}

// PUT /api/candidates/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await candidates().doc(id).get();
    if (!doc.exists) return notFound("Candidate");

    const body = await req.json().catch(() => null);
    const parsed = updateCandidateSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    await candidates().doc(id).update({
      ...parsed.data,
      updated_at: FieldValue.serverTimestamp(),
    });

    return success({ id, ...parsed.data });
  } catch (err) {
    console.error("[PUT /api/candidates/:id]", err);
    return serverError();
  }
}
