// src/lib/gcp/firestore.ts
// GCP Firestore client — 100% GCP SDK, no Firebase
import { Firestore } from "@google-cloud/firestore";

let firestoreInstance: Firestore | null = null;

/**
 * Parses the service account key from env var.
 * Supports both plain JSON and Base64-encoded JSON (recommended for Vercel).
 * Also handles double-quoted values that Vercel may wrap.
 */
export function parseServiceAccountKey(raw: string): Record<string, string> {
  // Strip surrounding quotes if Vercel double-quoted the value
  let cleaned = raw.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }

  // Try plain JSON first
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.client_email) return parsed;
  } catch {
    // Not valid JSON — try Base64
  }

  // Try Base64-encoded JSON
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed.client_email) return parsed;
  } catch {
    // Not valid Base64 either
  }

  throw new Error("GCP_SERVICE_ACCOUNT_KEY is not valid JSON or Base64-encoded JSON");
}

/**
 * Returns a singleton Firestore client configured from environment variables.
 * All credentials come from env vars (Vercel / .env.local), never hardcoded.
 */
export function getFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  const projectId = process.env.GCP_PROJECT_ID;
  const keyRaw = process.env.GCP_SERVICE_ACCOUNT_KEY;

  if (!projectId) {
    throw new Error("Missing GCP_PROJECT_ID environment variable");
  }

  if (!keyRaw) {
    throw new Error("Missing GCP_SERVICE_ACCOUNT_KEY environment variable");
  }

  const credentials = parseServiceAccountKey(keyRaw);

  // Normalize private_key newlines (Vercel may store literal \\n)
  const privateKey = (credentials.private_key || "").replace(/\\n/g, "\n");

  // Only pass databaseId if it's not the default
  const databaseId = process.env.FIRESTORE_DATABASE_ID;
  const firestoreOpts: ConstructorParameters<typeof Firestore>[0] = {
    projectId,
    credentials: {
      client_email: credentials.client_email,
      private_key: privateKey,
    },
  };

  if (databaseId && databaseId !== "(default)") {
    firestoreOpts.databaseId = databaseId;
  }

  firestoreInstance = new Firestore(firestoreOpts);

  return firestoreInstance;
}
