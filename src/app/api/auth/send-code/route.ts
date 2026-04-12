// src/app/api/auth/send-code/route.ts — Send OTP to email
import { otps } from "@/lib/gcp/collections";
import { sendOTP, EmailSendError } from "@/lib/email";
import { success, error, serverError } from "@/lib/utils/api-response";

// Simple in-memory rate limiter: max 5 requests per email per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 5;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error("Email inválido");
    }

    // Rate limiting
    if (isRateLimited(email)) {
      return error("Demasiados intentos. Espera 60 segundos.", 429);
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Firestore
    try {
      await otps().doc().set({
        email,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false,
        created_at: new Date(),
      });
    } catch (dbErr) {
      console.error("[POST /api/auth/send-code] Firestore error:", dbErr);
      return error("No pudimos procesar tu solicitud. Intenta de nuevo en unos minutos.", 503);
    }

    // Send email
    try {
      await sendOTP(email, code);
    } catch (emailErr) {
      if (emailErr instanceof EmailSendError) {
        console.error("[POST /api/auth/send-code] SMTP error:", emailErr.cause);
        return error("No pudimos enviar el código. Intenta de nuevo en unos minutos.", 503);
      }
      throw emailErr; // unexpected - re-throw for outer catch
    }

    return success({ sent: true });
  } catch (err) {
    console.error("[POST /api/auth/send-code] Unexpected:", err);
    return serverError("Algo salió mal. Intenta de nuevo.");
  }
}
