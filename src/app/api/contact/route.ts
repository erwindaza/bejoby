// src/app/api/contact/route.ts
import { contactForms } from "@/lib/gcp/collections";
import { createContactSchema } from "@/lib/validators/contact";
import { created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";

// POST /api/contact — Submit contact form
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const docRef = contactForms().doc();
    await docRef.set({
      ...parsed.data,
      created_at: FieldValue.serverTimestamp(),
    });

    console.log(`[contact] New ${parsed.data.source} form from ${parsed.data.email}`);

    return created({ id: docRef.id, message: "Message received" });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return serverError();
  }
}
