// src/app/api/auth/send-code/route.ts — Send OTP to email
import { otps } from "@/lib/gcp/collections";
import { sendOTP } from "@/lib/email";
import { success, error, serverError } from "@/lib/utils/api-response";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return error("Email inválido");
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Firestore
    await otps().doc().set({
      email,
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      used: false,
      created_at: new Date(),
    });

    // Send email (logs to console if SMTP not configured)
    await sendOTP(email, code);

    return success({ sent: true });
  } catch (err) {
    console.error("[POST /api/auth/send-code]", err);
    return serverError();
  }
}
