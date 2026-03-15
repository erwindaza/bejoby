// src/lib/gcp/firestore.ts
// GCP Firestore client — 100% GCP SDK, no Firebase
import { Firestore } from "@google-cloud/firestore";

let firestoreInstance: Firestore | null = null;

/**
 * Returns a singleton Firestore client configured from environment variables.
 * In production (Vercel), uses GCP_SERVICE_ACCOUNT_KEY.
 * Locally, uses the same env var from .env.local.
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

  firestoreInstance = new Firestore({
    projectId,
    databaseId,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });

  return firestoreInstance;
}
