import { describe, it, expect } from "vitest";
import {
  getPolicyForLevel,
  requiresEncryptionAtRest,
  requiresMasking,
  isAIAllowed,
  getAssetsForCollection,
} from "@/lib/compliance/data-classification";

describe("Data classification", () => {
  it("returns policy for SECRET level", () => {
    const policy = getPolicyForLevel("SECRET");
    expect(policy.encryptionAtRest).toBe(true);
    expect(policy.maskingRequired).toBe(true);
  });

  it("requires encryption for SENSITIVE data", () => {
    expect(requiresEncryptionAtRest("SENSITIVE")).toBe(true);
  });

  it("does not require encryption for PUBLIC data", () => {
    expect(requiresEncryptionAtRest("PUBLIC")).toBe(false);
  });

  it("requires masking for CRITICAL and SENSITIVE", () => {
    expect(requiresMasking("CRITICAL")).toBe(true);
    expect(requiresMasking("SENSITIVE")).toBe(true);
    expect(requiresMasking("INTERNAL")).toBe(false);
  });

  it("denies AI for SECRET data", () => {
    expect(isAIAllowed("SECRET")).toBe(false);
  });

  it("allows AI for PUBLIC data", () => {
    expect(isAIAllowed("PUBLIC")).toBe(true);
  });

  it("allows AI for SENSITIVE only when anonymized", () => {
    expect(isAIAllowed("SENSITIVE")).toBe(false);
    expect(isAIAllowed("SENSITIVE", true)).toBe(true);
  });

  it("returns assets for users collection", () => {
    const assets = getAssetsForCollection("users");
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.some((a) => a.name.includes("Perfil usuario"))).toBe(true);
  });
});
