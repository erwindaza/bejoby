// src/app/api/employers/[id]/route.ts
import { employers } from "@/lib/gcp/collections";
import { updateEmployerSchema } from "@/lib/validators/employer";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";

type Params = { params: Promise<{ id: string }> };

// GET /api/employers/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await employers().doc(id).get();
    if (!doc.exists) return notFound("Employer");
    return success({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("[GET /api/employers/:id]", err);
    return serverError();
  }
}

// PUT /api/employers/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await employers().doc(id).get();
    if (!doc.exists) return notFound("Employer");

    const body = await req.json().catch(() => null);
    const parsed = updateEmployerSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    await employers().doc(id).update({
      ...parsed.data,
      updated_at: FieldValue.serverTimestamp(),
    });

    return success({ id, ...parsed.data });
  } catch (err) {
    console.error("[PUT /api/employers/:id]", err);
    return serverError();
  }
}

// DELETE /api/employers/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await employers().doc(id).get();
    if (!doc.exists) return notFound("Employer");

    await employers().doc(id).delete();
    return success({ id, deleted: true });
  } catch (err) {
    console.error("[DELETE /api/employers/:id]", err);
    return serverError();
  }
}
