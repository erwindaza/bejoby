// src/app/api/candidates/route.ts
import { candidates } from "@/lib/gcp/collections";
import { createCandidateSchema } from "@/lib/validators/candidate";
import { success, created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";

// GET /api/candidates — List candidates
export async function GET() {
  try {
    const snapshot = await candidates().orderBy("created_at", "desc").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return success(data);
  } catch (err) {
    console.error("[GET /api/candidates]", err);
    return serverError();
  }
}

// POST /api/candidates — Register a candidate
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = createCandidateSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    // Check if candidate email already exists
    const existing = await candidates().where("email", "==", parsed.data.email).limit(1).get();
    if (!existing.empty) {
      const existingDoc = existing.docs[0];
      return error("A candidate with this email already exists", 409, { id: existingDoc.id });
    }

    const docRef = candidates().doc();
    await docRef.set({
      ...parsed.data,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    return created({ id: docRef.id, ...parsed.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/candidates]", message);
    // Surface config errors so we can debug in production
    if (message.includes("Missing")) {
      return error(message, 500);
    }
    return serverError();
  }
}
