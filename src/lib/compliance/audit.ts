import { FieldValue } from "@google-cloud/firestore";
import { auditEvents } from "@/lib/gcp/collections";

export type AuditEventType =
  | "LOGIN"
  | "FAILED_LOGIN"
  | "PROFILE_ACCESS"
  | "PROFILE_UPDATE"
  | "CV_UPLOAD"
  | "DATA_EXPORT"
  | "DATA_DELETION_REQUEST"
  | "CONSENT_GRANTED"
  | "CONSENT_WITHDRAWN"
  | "PRIVACY_REQUEST"
  | "AI_INFERENCE"
  | "AI_HUMAN_REVIEW"
  | "ADMIN_ACTION";

export interface AuditEventInput {
  type: AuditEventType;
  actor_id?: string;
  actor_email?: string;
  subject_id?: string;
  subject_type?: string;
  purpose?: string;
  metadata?: Record<string, unknown>;
}

function sanitizeAuditMetadata(metadata: Record<string, unknown> = {}) {
  const blocked = new Set(["password", "token", "access_token", "api_key", "secret", "private_key"]);
  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !blocked.has(key.toLowerCase())),
  );
}

export async function logAuditEvent(input: AuditEventInput): Promise<string | null> {
  try {
    const docRef = auditEvents().doc();
    await docRef.set({
      type: input.type,
      actor_id: input.actor_id || null,
      actor_email: input.actor_email || null,
      subject_id: input.subject_id || null,
      subject_type: input.subject_type || null,
      purpose: input.purpose || null,
      metadata: sanitizeAuditMetadata(input.metadata),
      created_at: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("[audit] failed to write audit event:", err instanceof Error ? err.message : err);
    return null;
  }
}
