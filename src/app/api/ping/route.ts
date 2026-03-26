// src/app/api/ping/route.ts
// Health check — only shows boolean status, never exposes secrets
import { NextResponse } from "next/server";

export async function GET() {
  const env = {
    GCP_PROJECT_ID: !!process.env.GCP_PROJECT_ID,
    GCP_SERVICE_ACCOUNT_KEY: !!process.env.GCP_SERVICE_ACCOUNT_KEY,
    FIRESTORE_DATABASE_ID: !!process.env.FIRESTORE_DATABASE_ID,
    FIRESTORE_PREFIX: process.env.FIRESTORE_PREFIX ?? "(not set)",
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Validate key structure (booleans only, no content)
  let keyValid = false;
  try {
    const raw = process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (raw) {
      const parsed = JSON.parse(raw);
      keyValid = !!(parsed.client_email && parsed.private_key);
    }
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
      // Only surface error code, not full message (may contain internal details)
      const msg = e instanceof Error ? e.message : "";
      const code = msg.match(/^(\d+\s\S+)/)?.[1] || "unknown";
      dbError = code;
    }
  }

  return NextResponse.json({
    status: "ok",
    env,
    serviceAccountKeyValid: keyValid,
    firestore: { status: dbStatus, ...(dbError && { code: dbError }) },
    timestamp: new Date().toISOString(),
  });
}
