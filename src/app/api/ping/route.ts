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

  // Validate key structure (booleans only, no content). If no key is present,
  // the SDK can still authenticate via Application Default Credentials.
  let keyValid = false;
  const usesAdc = !process.env.GCP_SERVICE_ACCOUNT_KEY;
  try {
    const { parseServiceAccountKey } = await import("@/lib/gcp/firestore");
    if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
      const parsed = parseServiceAccountKey(process.env.GCP_SERVICE_ACCOUNT_KEY);
      keyValid = !!(parsed.client_email && parsed.private_key);
    }
  } catch {
    keyValid = false;
  }

  // Test Firestore connectivity
  let dbStatus: "ok" | "error" | "skipped" = "skipped";
  let dbError = "";
  if (keyValid || usesAdc) {
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
    usesApplicationDefaultCredentials: usesAdc,
    firestore: { status: dbStatus, ...(dbError && { code: dbError }) },
    email: { configured: smtpConfigured },
    timestamp: new Date().toISOString(),
  });
}
