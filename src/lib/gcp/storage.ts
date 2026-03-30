// src/lib/gcp/storage.ts — GCS client for CV file uploads
import { Storage } from "@google-cloud/storage";
import { parseServiceAccountKey } from "./firestore";

const CV_BUCKET = process.env.GCS_CV_BUCKET || "bejoby-cvs";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

let storageInstance: Storage | null = null;

function getStorage(): Storage {
  if (storageInstance) return storageInstance;

  const projectId = process.env.GCP_PROJECT_ID;
  const keyRaw = process.env.GCP_SERVICE_ACCOUNT_KEY;

  if (!projectId || !keyRaw) {
    throw new Error("Missing GCP credentials for Storage");
  }

  const credentials = parseServiceAccountKey(keyRaw);
  const privateKey = (credentials.private_key || "").replace(/\\n/g, "\n");

  storageInstance = new Storage({
    projectId,
    credentials: {
      client_email: credentials.client_email,
      private_key: privateKey,
    },
  });

  return storageInstance;
}

/**
 * Upload a CV file to GCS. Returns the GCS path (not a public URL).
 * Files are stored as: cvs/{applicationId}/{filename}
 */
export async function uploadCV(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  applicationId: string,
): Promise<{ path: string; size: number }> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error(`Tipo de archivo no permitido. Solo PDF y DOCX.`);
  }

  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el límite de 5 MB.`);
  }

  // Sanitize filename
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `cvs/${applicationId}/${safeName}`;

  const storage = getStorage();
  const bucket = storage.bucket(CV_BUCKET);
  const file = bucket.file(path);

  await file.save(fileBuffer, {
    contentType: mimeType,
    metadata: {
      cacheControl: "private, max-age=0",
    },
  });

  return { path, size: fileBuffer.length };
}

/**
 * Generate a temporary signed URL to download a CV (valid for 1 hour).
 * Only the backend can generate these — files are not publicly accessible.
 */
export async function getSignedCVUrl(path: string): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket(CV_BUCKET);
  const file = bucket.file(path);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}
