// src/app/api/employers/route.ts
import { employers, users } from "@/lib/gcp/collections";
import { createEmployerSchema } from "@/lib/validators/employer";
import { isCorporateEmail, getCorporateEmailError } from "@/lib/validators/corporate-email";
import { success, created, error, serverError } from "@/lib/utils/api-response";
import { getSessionUser } from "@/lib/auth";
import { notifyEmployerRegistered } from "@/lib/email";
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

// POST /api/employers — Create a new employer (authenticated users only)
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return error("Unauthorized", 401);
    if (user.employer_id) return error("Employer profile already exists", 409);

    // Require a corporate email to reduce fake job postings.
    // Consumer emails (gmail, hotmail, etc.) are rejected.
    if (!isCorporateEmail(user.email)) {
      return error(getCorporateEmailError(user.email), 400);
    }

    const body = await req.json().catch(() => null);
    const parsed = createEmployerSchema.safeParse({ ...body, email: user.email });

    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const docRef = employers().doc();
    const employerData = {
      ...parsed.data,
      email: user.email,
      user_id: user.id,
      verification_status: "pending",
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await docRef.set(employerData);

    // Link employer to authenticated user
    await users().doc(user.id).update({ employer_id: docRef.id });

    // Notify BeJoby team for manual review (fire-and-forget)
    notifyEmployerRegistered({ id: docRef.id, ...parsed.data, email: user.email }).catch(() => {});

    return created({ id: docRef.id, ...parsed.data });
  } catch (err) {
    console.error("[POST /api/employers]", err);
    return serverError();
  }
}
