// src/app/api/employers/route.ts
import { employers } from "@/lib/gcp/collections";
import { createEmployerSchema } from "@/lib/validators/employer";
import { success, created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";

// GET /api/employers — List all employers
export async function GET() {
  try {
    const snapshot = await employers().orderBy("created_at", "desc").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return success(data);
  } catch (err) {
    console.error("[GET /api/employers]", err);
    return serverError();
  }
}

// POST /api/employers — Create a new employer
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createEmployerSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const docRef = employers().doc();
    await docRef.set({
      ...parsed.data,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return created({ id: docRef.id, ...parsed.data });
  } catch (err) {
    console.error("[POST /api/employers]", err);
    return serverError();
  }
}
