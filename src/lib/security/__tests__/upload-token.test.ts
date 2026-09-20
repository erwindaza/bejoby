import { describe, expect, it } from "vitest";
import { createUploadToken, hashUploadToken, verifyUploadToken } from "../upload-token";

describe("CV upload tokens", () => {
  it("creates a verifiable, expiring token without storing the raw value", () => {
    const result = createUploadToken();

    expect(result.token).toHaveLength(43);
    expect(result.hash).toBe(hashUploadToken(result.token));
    expect(result.hash).not.toContain(result.token);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(verifyUploadToken(result.token, result.hash)).toBe(true);
  });

  it("rejects a different token and malformed hashes", () => {
    const result = createUploadToken();

    expect(verifyUploadToken(`${result.token}x`, result.hash)).toBe(false);
    expect(verifyUploadToken(result.token, "invalid")).toBe(false);
  });
});
