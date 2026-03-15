// src/app/api/ping/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const envStatus = {
    GCP_PROJECT_ID: !!process.env.GCP_PROJECT_ID,
    GCP_SERVICE_ACCOUNT_KEY: !!process.env.GCP_SERVICE_ACCOUNT_KEY,
    FIRESTORE_DATABASE_ID: !!process.env.FIRESTORE_DATABASE_ID,
    FIRESTORE_PREFIX: process.env.FIRESTORE_PREFIX ?? "(not set)",
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json({
    message: "Pong! API funcionando 🚀",
    env: envStatus,
    timestamp: new Date().toISOString(),
  });
}
