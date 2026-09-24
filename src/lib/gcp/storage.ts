// src/lib/gcp/storage.ts — GCS client for CV file uploads
import { Storage } from "@google-cloud/storage";
import { getGcpClientAuthOptions } from "./firestore";

const CV_BUCKET = process.env.GCS_CV_BUCKET || "bejoby-cvs";
const CV_KMS_KEY_NAME = process.env.GCS_CV_KMS_KEY_NAME;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function hasExpectedSignature(fileBuffer: Buffer, mimeType: string): boolean {
  if (mimeType === "application/pdf") return fileBuffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mimeType === "application/msword") {
    return fileBuffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }
  return fileBuffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
}

let storageInstance: Storage | null = null;

function getStorage(): Storage {
  if (storageInstance) return storageInstance;

  storageInstance = new Storage(getGcpClientAuthOptions());

  return storageInstance;
}

/**
 * Upload a CV file to GCS. Returns the GCS path (not a public URL).
 * Files are stored in the raw data zone as: raw/cvs/{applicationId}/{filename}
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

  if (!hasExpectedSignature(fileBuffer, mimeType)) {
    throw new Error("El contenido del archivo no coincide con un PDF o documento Word válido.");
  }

  // Sanitize filename
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `raw/cvs/${applicationId}/${safeName}`;

  const storage = getStorage();
  const bucket = storage.bucket(CV_BUCKET);
  const file = bucket.file(path, CV_KMS_KEY_NAME ? { kmsKeyName: CV_KMS_KEY_NAME } : undefined);

  await file.save(fileBuffer, {
    contentType: mimeType,
    resumable: false,
    validation: "crc32c",
    metadata: {
      cacheControl: "private, max-age=0",
      contentDisposition: `attachment; filename="${safeName}"`,
      metadata: {
        dataClassification: "confidential-candidate-cv",
      },
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
