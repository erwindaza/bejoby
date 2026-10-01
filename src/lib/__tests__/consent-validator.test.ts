import { describe, it, expect } from "vitest";
import { createConsentSchema } from "../validators/consent";

describe("createConsentSchema", () => {
  it("accepts valid coach consent", () => {
    const result = createConsentSchema.safeParse({
      consent_type: "coach_usage",
      purpose: "Usar el coach laboral",
      policy_version: "1.0-coach",
      consent_text_snapshot: "Texto legal mostrado al usuario con detalle suficiente.",
      accepted: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects when accepted is not true", () => {
    const result = createConsentSchema.safeParse({
      consent_type: "coach_usage",
      purpose: "Usar el coach laboral",
      policy_version: "1.0-coach",
      consent_text_snapshot: "Texto legal mostrado al usuario con detalle suficiente.",
      accepted: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing consent_text_snapshot", () => {
    const result = createConsentSchema.safeParse({
      consent_type: "coach_usage",
      purpose: "Usar el coach laboral",
      policy_version: "1.0-coach",
      accepted: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid consent_type", () => {
    const result = createConsentSchema.safeParse({
      consent_type: "invalid_type",
      purpose: "Usar el coach laboral",
      policy_version: "1.0-coach",
      consent_text_snapshot: "Texto legal mostrado al usuario con detalle suficiente.",
      accepted: true,
    });

    expect(result.success).toBe(false);
  });
});
