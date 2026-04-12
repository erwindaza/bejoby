// src/app/api/ping/route.ts
// Health check — only shows boolean status, never exposes secrets
import { NextResponse } from "next/server";

export async function GET() {
  const env = {
    GCP_PROJECT_ID: !!process.env.GCP_PROJECT_ID,
    GCP_SERVICE_ACCOUNT_KEY: !!process.env.GCP_SERVICE_ACCOUNT_KEY,
    FIRESTORE_PREFIX: process.env.FIRESTORE_PREFIX ?? "(not set)",
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SMTP_HOST: process.env.SMTP_HOST || "smtp.zoho.com",
    NODE_ENV: process.env.NODE_ENV,
  };

  // Validate key structure (booleans only, no content)
  let keyValid = false;
  try {
    const { parseServiceAccountKey } = await import("@/lib/gcp/firestore");
    const parsed = parseServiceAccountKey(process.env.GCP_SERVICE_ACCOUNT_KEY || "");
    keyValid = !!(parsed.client_email && parsed.private_key);
  } catch {
    keyValid = false;
  }

  // Test Firestore connectivity
  let dbStatus: "ok" | "error" | "skipped" = "skipped";
  let dbError = "";
  if (keyValid) {
    try {
      const { getFirestore } = await import("@/lib/gcp/firestore");
      const db = getFirestore();
      await db.listCollections();
      dbStatus = "ok";
    } catch (e) {
      dbStatus = "error";
      const msg = e instanceof Error ? e.message : "";
      const code = msg.match(/^(\d+\s\S+)/)?.[1] || "unknown";
      dbError = code;
    }
  }

  // Check SMTP configuration
  const { isSmtpConfigured } = await import("@/lib/email");
  const smtpConfigured = isSmtpConfigured();

  return NextResponse.json({
    status: "ok",
    env,
    serviceAccountKeyValid: keyValid,
    firestore: { status: dbStatus, ...(dbError && { code: dbError }) },
    email: { configured: smtpConfigured },
    timestamp: new Date().toISOString(),
  });
}
