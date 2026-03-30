// src/app/api/jobs/[id]/route.ts
import { jobs } from "@/lib/gcp/collections";
import { updateJobSchema } from "@/lib/validators/job";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { getSessionUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/jobs/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await jobs().doc(id).get();
    if (!doc.exists) return notFound("Job");
    return success({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("[GET /api/jobs/:id]", err);
    return serverError();
  }
}

// PUT /api/jobs/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await jobs().doc(id).get();
    if (!doc.exists) return notFound("Job");

    const body = await req.json().catch(() => null);
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    await jobs().doc(id).update({
      ...parsed.data,
      updated_at: FieldValue.serverTimestamp(),
    });

    return success({ id, ...parsed.data });
  } catch (err) {
    console.error("[PUT /api/jobs/:id]", err);
    return serverError();
  }
}

// DELETE /api/jobs/:id — Auth-protected: only job owner can delete
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    // Require authentication
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    const doc = await jobs().doc(id).get();
    if (!doc.exists) return notFound("Job");

    // Verify ownership: user's employer_id must match job's employer_id
    const jobData = doc.data()!;
    if (!user.employer_id || jobData.employer_id !== user.employer_id) {
      return error("No autorizado para eliminar esta oferta", 403);
    }

    await jobs().doc(id).delete();
    return success({ id, deleted: true });
  } catch (err) {
    console.error("[DELETE /api/jobs/:id]", err);
    return serverError();
  }
}
