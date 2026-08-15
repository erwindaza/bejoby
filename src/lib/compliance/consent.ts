import { FieldValue } from "@google-cloud/firestore";
import { consentRecords } from "@/lib/gcp/collections";
import { logAuditEvent } from "./audit";

export type ConsentStatus = "GRANTED" | "WITHDRAWN";

export interface ConsentRecordInput {
  user_id?: string;
  candidate_id?: string;
  email: string;
  purpose: string;
  policy_version: string;
  source: string;
  status?: ConsentStatus;
  metadata?: Record<string, unknown>;
}

export async function recordConsent(input: ConsentRecordInput): Promise<string> {
  const docRef = consentRecords().doc();
  const status = input.status || "GRANTED";

  await docRef.set({
    user_id: input.user_id || null,
    candidate_id: input.candidate_id || null,
    email: input.email.trim().toLowerCase(),
    purpose: input.purpose,
    policy_version: input.policy_version,
    source: input.source,
    consent_status: status,
    metadata: input.metadata || {},
    recorded_at: FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    type: status === "GRANTED" ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN",
    actor_id: input.user_id || input.candidate_id,
    actor_email: input.email,
    subject_id: docRef.id,
    subject_type: "consent_record",
    purpose: input.purpose,
  });

  return docRef.id;
}
