import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  encryptUserPII,
  decryptUserPII,
  buildEncryptedUserRecord,
  redactUserRecord,
  hashForLookup,
} from "@/lib/security/pii";

describe("User PII encryption", () => {
  const originalEncryptionKey = process.env.FIELD_ENCRYPTION_KEY;
  const originalHashKey = process.env.FIELD_HASH_KEY;

  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = "a".repeat(64);
    process.env.FIELD_HASH_KEY = "b".repeat(64);
  });

  afterAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = originalEncryptionKey;
    process.env.FIELD_HASH_KEY = originalHashKey;
  });

  it("encrypts and decrypts user email and name", () => {
    const input = { name: "Ana Pérez", email: "ana@example.com" };
    const encrypted = encryptUserPII(input);

    expect(encrypted.email).toHaveProperty("ciphertext");
    expect(encrypted.email).toHaveProperty("iv");
    expect(encrypted.email).toHaveProperty("tag");
    expect(encrypted.email.alg).toBe("aes-256-gcm");

    const decrypted = decryptUserPII({ pii: encrypted });
    expect(decrypted.email).toBe("ana@example.com");
    expect(decrypted.name).toBe("Ana Pérez");
  });

  it("builds encrypted user record with email hash", () => {
    const input = { name: "Ana Pérez", email: "ANA@EXAMPLE.COM" };
    const record = buildEncryptedUserRecord(input);

    expect(record.pii_encrypted).toBe(true);
    expect(record.email_hash).toBe(hashForLookup("ana@example.com"));
    expect(record.pii.email).toHaveProperty("ciphertext");
  });

  it("redacts user record for safe views", () => {
    const input = { name: "Ana Pérez", email: "ana@example.com" };
    const record = buildEncryptedUserRecord(input);
    const redacted = redactUserRecord("user-123", record as Record<string, unknown>);

    expect(redacted.id).toBe("user-123");
    expect(redacted.email_masked).toContain("*");
    expect(redacted.name_masked).toContain("*");
    expect(redacted.pii_encrypted).toBe(true);
  });
});
