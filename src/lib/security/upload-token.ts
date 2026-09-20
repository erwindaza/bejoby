import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const CV_UPLOAD_TOKEN_TTL_MS = 30 * 60 * 1000;

export function createUploadToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashUploadToken(token),
    expiresAt: new Date(Date.now() + CV_UPLOAD_TOKEN_TTL_MS),
  };
}

export function hashUploadToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyUploadToken(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashUploadToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
