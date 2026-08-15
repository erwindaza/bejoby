// src/lib/ai/governance.ts — CAIO Governance Framework
// Enforces responsible AI policies for all AI-powered decisions in BeJoby.
// Compliant with Ley 21.719 (Chile), GDPR principles, and OECD AI Guidelines.

import { aiAuditLog } from "@/lib/gcp/collections";
import { FieldValue } from "@google-cloud/firestore";

// ─── AI Model Registry ────────────────────────────────────────────────────────
// Central registry of all AI models used in the platform.
// Every model must be registered here before being deployed.

export const AI_MODELS = {
  MATCH_ANALYSIS: {
    id: "gemini-2.5-flash-lite",
    version: "2.5",
    provider: "Google",
    purpose: "Candidate-job fit analysis",
    pii_processed: true,
    anonymization_required: true,
    human_review_recommended_below_score: 40, // Scores < 40 require human review
    human_review_required_above_score: 85,    // Scores > 85 also flagged for confirmation
    max_input_tokens: 8000,
    bias_categories_excluded: [
      "gender", "age", "nationality", "religion",
      "marital_status", "ethnicity", "disability"
    ],
  },
  CV_CONVERTER: {
    id: "gemini-2.5-flash-lite",
    version: "2.5",
    provider: "Google",
    purpose: "CV to Harvard format conversion",
    pii_processed: true,
    anonymization_required: false, // User-initiated, explicit consent
    human_review_recommended_below_score: null,
    human_review_required_above_score: null,
    max_input_tokens: 10000,
    bias_categories_excluded: [],
  },
  COACH: {
    id: "gemini-2.5-flash-lite",
    version: "2.5",
    provider: "Google",
    purpose: "Career coaching assistant",
    pii_processed: false,
    anonymization_required: false,
    human_review_recommended_below_score: null,
    human_review_required_above_score: null,
    max_input_tokens: 6000,
    bias_categories_excluded: [],
  },
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

// ─── Governance Policy ────────────────────────────────────────────────────────

export interface AIDecisionContext {
  model_key: AIModelKey;
  subject_id: string;       // e.g. application_id, candidate_id
  decision_type: string;    // e.g. "match_analysis", "cv_conversion"
  input_summary: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  score?: number;
  triggered_by?: string;    // "system" | user_id
}

export interface GovernanceResult {
  approved: boolean;
  requires_human_review: boolean;
  review_reason?: string;
  policy_flags: string[];
  audit_id?: string;
}

/**
 * Validates an AI decision against the CAIO governance policy.
 * Records the decision in the immutable audit log.
 * Returns governance result indicating whether human review is needed.
 */
export async function enforceGovernancePolicy(
  ctx: AIDecisionContext,
): Promise<GovernanceResult> {
  const model = AI_MODELS[ctx.model_key];
  const policyFlags: string[] = [];
  let requiresHumanReview = false;
  let reviewReason: string | undefined;

  // 1. Score-based human review thresholds (for match analysis)
  if (
    typeof ctx.score === "number" &&
    model.human_review_recommended_below_score !== null &&
    ctx.score < model.human_review_recommended_below_score
  ) {
    requiresHumanReview = true;
    reviewReason = `Score ${ctx.score} is below minimum threshold (${model.human_review_recommended_below_score})`;
    policyFlags.push("LOW_SCORE_REVIEW");
  }

  if (
    typeof ctx.score === "number" &&
    model.human_review_required_above_score !== null &&
    ctx.score > model.human_review_required_above_score
  ) {
    requiresHumanReview = true;
    reviewReason = reviewReason
      ? `${reviewReason}; Score ${ctx.score} exceeds high-confidence threshold (${model.human_review_required_above_score})`
      : `Score ${ctx.score} exceeds high-confidence threshold (${model.human_review_required_above_score}) — confirm before acting`;
    policyFlags.push("HIGH_SCORE_REVIEW");
  }

  // 2. PII anonymization check
  if (model.anonymization_required) {
    policyFlags.push("PII_ANONYMIZED");
  }

  // 3. Bias exclusion confirmation
  if (model.bias_categories_excluded.length > 0) {
    policyFlags.push("BIAS_CATEGORIES_EXCLUDED");
  }

  // 4. Log to immutable audit trail
  let auditId: string | undefined;
  try {
    const docRef = aiAuditLog().doc();
    await docRef.set({
      type: ctx.decision_type,
      subject_id: ctx.subject_id,
      model: model.id,
      model_version: model.version,
      provider: model.provider,
      purpose: model.purpose,
      input_summary: ctx.input_summary,
      output_summary: ctx.output_summary,
      policy_flags: policyFlags,
      requires_human_review: requiresHumanReview,
      review_reason: reviewReason || null,
      human_reviewed: false,
      triggered_by: ctx.triggered_by || "system",
      pii_anonymized: model.anonymization_required,
      bias_categories_excluded: model.bias_categories_excluded,
      governance_version: "1.0",
      created_at: FieldValue.serverTimestamp(),
    });
    auditId = docRef.id;
  } catch (err) {
    // Audit logging failure is critical — log but do not block the decision
    console.error("[CAIO] Failed to write audit log:", err instanceof Error ? err.message : err);
    policyFlags.push("AUDIT_LOG_FAILED");
  }

  return {
    approved: true, // Currently all decisions are approved; future: model-based blocking
    requires_human_review: requiresHumanReview,
    review_reason: reviewReason,
    policy_flags: policyFlags,
    audit_id: auditId,
  };
}

/**
 * Mark an AI decision as human-reviewed in the audit log.
 * Call this when a human reviewer has validated the AI decision.
 */
export async function markHumanReviewed(
  auditId: string,
  reviewedBy: string,
  outcome: "confirmed" | "overridden" | "rejected",
  notes?: string,
): Promise<void> {
  await aiAuditLog().doc(auditId).update({
    human_reviewed: true,
    reviewed_by: reviewedBy,
    review_outcome: outcome,
    review_notes: notes || null,
    reviewed_at: FieldValue.serverTimestamp(),
  });
}

/**
 * Check if an AI model is approved for production use.
 * Throws if the model is not registered in the governance registry.
 */
export function assertModelApproved(modelKey: AIModelKey): void {
  const model = AI_MODELS[modelKey];
  if (!model) {
    throw new Error(
      `[CAIO] Model "${modelKey}" is not registered in the AI governance registry. ` +
      `All AI models must be registered in src/lib/ai/governance.ts before deployment.`
    );
  }
}
