// src/app/api/candidates/[id]/route.ts
import { candidates } from "@/lib/gcp/collections";
import { updateCandidateSchema } from "@/lib/validators/candidate";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { buildEncryptedCandidateRecord, decryptCandidatePII, redactCandidateRecord } from "@/lib/security/pii";

type Params = { params: Promise<{ id: string }> };

// GET /api/candidates/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const doc = await candidates().doc(id).get();
    if (!doc.exists) return notFound("Candidate");
    return success(redactCandidateRecord(doc.id, doc.data() as Record<string, unknown>));
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

    const current = doc.data() as Record<string, unknown>;
    const decrypted = decryptCandidatePII(current);
    const mergedPii = {
      name: typeof parsed.data.name === "string" ? parsed.data.name : String(decrypted.name || ""),
      email: typeof parsed.data.email === "string" ? parsed.data.email : String(decrypted.email || ""),
      phone: typeof parsed.data.phone === "string" ? parsed.data.phone : String(decrypted.phone || ""),
      linkedin: typeof parsed.data.linkedin === "string" ? parsed.data.linkedin : String(decrypted.linkedin || ""),
      resume_url: typeof parsed.data.resume_url === "string" ? parsed.data.resume_url : String(decrypted.resume_url || ""),
      resume_text: typeof parsed.data.resume_text === "string" ? parsed.data.resume_text : String(decrypted.resume_text || ""),
    };

    await candidates().doc(id).update({
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
      ...buildEncryptedCandidateRecord(mergedPii),
      updated_at: FieldValue.serverTimestamp(),
    });

    return success({
      id,
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
      pii_encrypted: true,
    });
  } catch (err) {
    console.error("[PUT /api/candidates/:id]", err);
    return serverError();
  }
}
