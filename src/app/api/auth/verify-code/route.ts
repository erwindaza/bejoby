// src/app/api/auth/verify-code/route.ts — Verify OTP, create session
import { otps, users, employers } from "@/lib/gcp/collections";
import { sessions } from "@/lib/gcp/collections";
import { success, error, serverError } from "@/lib/utils/api-response";
import { cookies } from "next/headers";

const SESSION_COOKIE = "bejoby_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim().toLowerCase();
    const code = body?.code?.toString().trim();

    if (!email || !code) {
      return error("Email y código son requeridos");
    }

    // Find valid OTP — query by email only, filter in JS to avoid composite indexes
    const snapshot = await otps().where("email", "==", email).get();
    let validOtpDoc = null;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.code !== code || data.used) continue;
      const expiresAt = data.expires_at?.toDate
        ? data.expires_at.toDate()
        : new Date(data.expires_at);
      if (expiresAt > new Date()) {
        validOtpDoc = doc;
        break;
      }
    }

    if (!validOtpDoc) {
      return error("Código inválido o expirado", 401);
    }

    // Mark OTP as used
    await otps().doc(validOtpDoc.id).update({ used: true });

    // Find or create user
    const userSnapshot = await users().where("email", "==", email).limit(1).get();
    let userId: string;
    let employerId: string | undefined;

    if (userSnapshot.empty) {
      // New user
      const userRef = users().doc();
      await userRef.set({ email, created_at: new Date() });
      userId = userRef.id;
    } else {
      userId = userSnapshot.docs[0].id;
      employerId = userSnapshot.docs[0].data().employer_id;
    }

    // Auto-link employer if one exists with this email
    if (!employerId) {
      const empSnapshot = await employers()
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!empSnapshot.empty) {
        employerId = empSnapshot.docs[0].id;
        await users().doc(userId).update({ employer_id: employerId });
      }
    }

    // Create session
    const token = crypto.randomUUID();
    await sessions().doc(token).set({
      user_id: userId,
      email,
      expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000),
      created_at: new Date(),
    });

    // Set httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return success({ user_id: userId, email, employer_id: employerId || null });
  } catch (err) {
    console.error("[POST /api/auth/verify-code]", err);
    return serverError("Algo salió mal al verificar. Intenta de nuevo.");
  }
}
