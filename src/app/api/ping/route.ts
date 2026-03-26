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

  // Test Firestore key parsing
  let firestoreTest = "not tested";
  let keyDiag = {};
  try {
    const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;
    if (keyJson) {
      const parsed = JSON.parse(keyJson);
      const pk = parsed.private_key || "";
      firestoreTest = parsed.client_email
        ? `key_ok: ${parsed.client_email}`
        : "key_parsed_but_no_client_email";
      keyDiag = {
        hasClientEmail: !!parsed.client_email,
        hasPrivateKey: !!parsed.private_key,
        privateKeyLength: pk.length,
        startsWithBegin: pk.startsWith("-----BEGIN"),
        endsWithEnd: pk.trimEnd().endsWith("-----END PRIVATE KEY-----"),
        containsRealNewlines: pk.includes("\n"),
        containsLiteralBackslashN: pk.includes("\\n"),
        first50: pk.substring(0, 50),
      };
    } else {
      firestoreTest = "no_key";
    }
  } catch (e) {
    firestoreTest = `json_parse_error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Try actual Firestore connection
  let dbTest = "not tested";
  try {
    const { getFirestore } = await import("@/lib/gcp/firestore");
    const db = getFirestore();
    // Simple listCollections to test auth
    const collections = await db.listCollections();
    dbTest = `connected (${collections.length} collections)`;
  } catch (e) {
    dbTest = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    message: "Pong! API funcionando 🚀",
    env: envStatus,
    firestoreKeyTest: firestoreTest,
    keyDiagnostics: keyDiag,
    firestoreConnectionTest: dbTest,
    timestamp: new Date().toISOString(),
  });
}
