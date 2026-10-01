import { FieldValue } from "@google-cloud/firestore";
import { consentRecords } from "@/lib/gcp/collections";
import { logAuditEvent } from "./audit";
import { logDataLineage } from "./data-lineage";

export type ConsentStatus = "GRANTED" | "WITHDRAWN";

export type ConsentType =
  | "coach_usage"
  | "profile_processing"
  | "job_application_sharing"
  | "ai_processing"
  | "marketing_optional"
  | "donation"
  | "other";

export type LegalBasis =
  | "consent"
  | "contract"
  | "legal_obligation"
  | "legitimate_interest"
  | "other";

export interface ConsentRecordInput {
  user_id?: string;
  candidate_id?: string;
  email: string;
  consent_type?: ConsentType;
  purpose: string;
  purpose_code?: string;
  legal_basis?: LegalBasis;
  policy_version: string;
  consent_text_version?: string;
  consent_text_snapshot?: string;
  source?: string;
  ip_hash?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ConsentRecord {
  user_id: string | null;
  candidate_id: string | null;
  email: string;
  consent_type: ConsentType;
  purpose: string;
  purpose_code: string;
  legal_basis: LegalBasis;
  policy_version: string;
  consent_text_version: string;
  consent_text_snapshot: string;
  accepted: boolean;
  accepted_at: FirebaseFirestore.Timestamp | null;
  withdrawn_at: FirebaseFirestore.Timestamp | null;
  withdrawal_reason: string | null;
  source: string;
  ip_hash: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  recorded_at: FirebaseFirestore.Timestamp;
}

/**
 * Registra un consentimiento de forma append-only.
 * Requiere consent_text_snapshot y accepted === true explícito.
 */
export async function recordConsent(input: ConsentRecordInput): Promise<string> {
  const docRef = consentRecords().doc();

  await docRef.set({
    user_id: input.user_id || null,
    candidate_id: input.candidate_id || null,
    email: input.email.trim().toLowerCase(),
    consent_type: input.consent_type || "other",
    purpose: input.purpose,
    purpose_code: input.purpose_code || input.consent_type || "other",
    legal_basis: input.legal_basis || "consent",
    policy_version: input.policy_version,
    consent_text_version: input.consent_text_version || input.policy_version,
    consent_text_snapshot: input.consent_text_snapshot || "",
    accepted: true,
    accepted_at: FieldValue.serverTimestamp(),
    withdrawn_at: null,
    withdrawal_reason: null,
    source: input.source || "web",
    ip_hash: input.ip_hash || null,
    user_agent: input.user_agent || null,
    metadata: input.metadata || {},
    recorded_at: FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    type: "CONSENT_GRANTED",
    actor_id: input.user_id || input.candidate_id,
    actor_email: input.email,
    subject_id: docRef.id,
    subject_type: "consent_record",
    purpose: input.purpose,
    metadata: {
      consent_type: input.consent_type || "other",
      policy_version: input.policy_version,
      legal_basis: input.legal_basis || "consent",
    },
  });

  await logDataLineage({
    subject_type: "consent",
    subject_id: docRef.id,
    action: "created",
    actor_id: input.user_id || input.candidate_id,
    actor_type: "user",
    actor_email_hash: input.ip_hash || undefined,
    legal_basis: input.legal_basis || "consent",
    purpose_code: input.purpose_code || input.consent_type || "other",
    source_system: "recordConsent",
    consent_record_id: docRef.id,
  });

  return docRef.id;
}

/**
 * Retira un consentimiento sin borrar el registro original.
 * El snapshot del texto aceptado nunca se modifica.
 */
export async function withdrawConsent(
  consentId: string,
  reason?: string,
  actorId?: string,
): Promise<void> {
  const docRef = consentRecords().doc(consentId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("Consent record not found");

  const data = doc.data() as ConsentRecord;

  await docRef.update({
    withdrawn_at: FieldValue.serverTimestamp(),
    withdrawal_reason: reason || null,
  });

  await logAuditEvent({
    type: "CONSENT_WITHDRAWN",
    actor_id: actorId || data.user_id || data.candidate_id || undefined,
    actor_email: data.email,
    subject_id: consentId,
    subject_type: "consent_record",
    purpose: data.purpose,
    metadata: { reason: reason || null },
  });

  await logDataLineage({
    subject_type: "consent",
    subject_id: consentId,
    action: "withdrawn",
    actor_id: actorId || data.user_id || data.candidate_id || undefined,
    actor_type: actorId ? "admin" : "user",
    legal_basis: "consent",
    purpose_code: data.purpose_code,
    source_system: "withdrawConsent",
    consent_record_id: consentId,
    metadata: { reason: reason || null },
  });
}

/**
 * Verifica si existe un consentimiento vigente del tipo solicitado.
 * "Vigente" = aceptado y no retirado.
 */
export async function hasValidConsent(
  candidateId: string,
  consentType: ConsentType,
): Promise<boolean> {
  const snapshot = await consentRecords()
    .where("candidate_id", "==", candidateId)
    .where("consent_type", "==", consentType)
    .where("withdrawn_at", "==", null)
    .limit(1)
    .get();

  return !snapshot.empty;
}

/**
 * Obtiene el consentimiento vigente más reciente de un tipo dado.
 */
export async function getLatestValidConsent(
  candidateId: string,
  consentType: ConsentType,
): Promise<ConsentRecord | null> {
  const snapshot = await consentRecords()
    .where("candidate_id", "==", candidateId)
    .where("consent_type", "==", consentType)
    .where("withdrawn_at", "==", null)
    .orderBy("accepted_at", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as ConsentRecord;
}
