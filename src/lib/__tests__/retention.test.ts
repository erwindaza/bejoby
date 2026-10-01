import { describe, it, expect } from "vitest";
import {
  getRetentionRule,
  isEligibleForDeletion,
  canDeleteCandidate,
} from "@/lib/compliance/retention";

describe("Retention rules", () => {
  it("returns rule for active_candidate", () => {
    const rule = getRetentionRule("active_candidate");
    expect(rule.days).toBe(365);
    expect(rule.action).toBe("keep");
  });

  it("returns rule for inactive_candidate", () => {
    const rule = getRetentionRule("inactive_candidate");
    expect(rule.days).toBe(365);
    expect(rule.action).toBe("delete");
  });

  it("returns rule for audit_and_consent", () => {
    const rule = getRetentionRule("audit_and_consent");
    expect(rule.days).toBe(1825);
    expect(rule.action).toBe("keep");
  });

  it("detects eligible deletion for old inactive data", () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);

    expect(isEligibleForDeletion(twoYearsAgo, "inactive_candidate")).toBe(true);
  });

  it("rejects deletion for keep categories", () => {
    const oldDate = new Date("2020-01-01");
    expect(isEligibleForDeletion(oldDate, "audit_and_consent")).toBe(false);
  });

  it("allows deletion when no blockers exist", () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);

    const result = canDeleteCandidate(twoYearsAgo, false, false, false);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("blocks deletion when active applications exist", () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);

    const result = canDeleteCandidate(twoYearsAgo, true, false, false);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("postulaciones"))).toBe(true);
  });

  it("blocks deletion within retention period", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = canDeleteCandidate(yesterday, false, false, false);
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("retención"))).toBe(true);
  });
});
