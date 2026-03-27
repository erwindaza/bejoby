// src/lib/gcp/firestore.ts
// GCP Firestore client — 100% GCP SDK, no Firebase
import { Firestore } from "@google-cloud/firestore";

let firestoreInstance: Firestore | null = null;

/**
 * Returns a singleton Firestore client configured from environment variables.
 * All credentials come from env vars (Vercel / .env.local), never hardcoded.
 */
export function getFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  const projectId = process.env.GCP_PROJECT_ID;
  const databaseId = process.env.FIRESTORE_DATABASE_ID || "(default)";
  const keyJson = process.env.GCP_SERVICE_ACCOUNT_KEY;

  if (!projectId) {
    throw new Error("Missing GCP_PROJECT_ID environment variable");
  }

  if (!keyJson) {
    throw new Error("Missing GCP_SERVICE_ACCOUNT_KEY environment variable");
  }

  const credentials = JSON.parse(keyJson);

  // Vercel may store literal "\\n" instead of real newlines in private_key.
  // Normalize to ensure RSA key is valid.
  const privateKey = (credentials.private_key || "").replace(/\\n/g, "\n");

  firestoreInstance = new Firestore({
    projectId,
    databaseId,
    credentials: {
      client_email: credentials.client_email,
      private_key: privateKey,
    },
  });

  return firestoreInstance;
}
