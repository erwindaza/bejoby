// src/app/api/applications/[id]/route.ts
import { applications } from "@/lib/gcp/collections";
import { updateApplicationSchema } from "@/lib/validators/application";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";

type Params = { params: Promise<{ id: string }> };

// GET /api/applications/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await applications().doc(id).get();
    if (!doc.exists) return notFound("Application");
    return success({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("[GET /api/applications/:id]", err);
    return serverError();
  }
}

// PUT /api/applications/:id — Update application status
export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await applications().doc(id).get();
    if (!doc.exists) return notFound("Application");

    const body = await req.json().catch(() => null);
    const parsed = updateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    await applications().doc(id).update({
      ...parsed.data,
      updated_at: FieldValue.serverTimestamp(),
    });

    return success({ id, ...parsed.data });
  } catch (err) {
    console.error("[PUT /api/applications/:id]", err);
    return serverError();
  }
}
