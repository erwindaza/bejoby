// src/lib/compliance/data-lineage.ts
// Registro de linaje de datos sensibles para BeJoby.
// Propósito: trazabilidad completa del ciclo de vida de datos personales.

import { FieldValue } from "@google-cloud/firestore";
import { dataLineageEvents } from "@/lib/gcp/collections";

export type LineageSubjectType =
  | "candidate"
  | "application"
  | "cv"
  | "employer"
  | "donation"
  | "consent"
  | "privacy_request";

export type LineageAction =
  | "created"
  | "encrypted"
  | "decrypted"
  | "hashed"
  | "anonymized"
  | "shared"
  | "accessed"
  | "exported"
  | "rectified"
  | "blocked"
  | "deleted"
  | "anonymized_retention"
  | "withdrawn";

export type ActorType = "user" | "employer" | "system" | "admin";

export interface DataLineageEventInput {
  subject_type: LineageSubjectType;
  subject_id: string;
  field_path?: string;
  action: LineageAction;
  actor_id?: string;
  actor_type: ActorType;
  actor_email_hash?: string;
  legal_basis: string;
  purpose_code: string;
  consent_record_id?: string;
  source_system: string;
  destination_system?: string;
  previous_lineage_id?: string;
  metadata?: Record<string, unknown>;
}

export interface DataLineageEvent extends DataLineageEventInput {
  lineage_id: string;
  created_at: FirebaseFirestore.Timestamp;
}

/**
 * Registra un evento de linaje en Firestore.
 * Es append-only: nunca se actualiza ni borra.
 */
export async function logDataLineage(
  input: DataLineageEventInput,
): Promise<{ lineage_id: string }> {
  const docRef = dataLineageEvents().doc();

  const payload: Record<string, unknown> = {
    lineage_id: docRef.id,
    subject_type: input.subject_type,
    subject_id: input.subject_id,
    action: input.action,
    actor_type: input.actor_type,
    legal_basis: input.legal_basis,
    purpose_code: input.purpose_code,
    source_system: input.source_system,
    created_at: FieldValue.serverTimestamp(),
  };

  if (input.field_path) payload.field_path = input.field_path;
  if (input.actor_id) payload.actor_id = input.actor_id;
  if (input.actor_email_hash) payload.actor_email_hash = input.actor_email_hash;
  if (input.consent_record_id) payload.consent_record_id = input.consent_record_id;
  if (input.destination_system) payload.destination_system = input.destination_system;
  if (input.previous_lineage_id) payload.previous_lineage_id = input.previous_lineage_id;
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    payload.metadata = sanitizeMetadata(input.metadata);
  }

  await docRef.set(payload);
  return { lineage_id: docRef.id };
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set([
    "password",
    "token",
    "access_token",
    "api_key",
    "secret",
    "private_key",
    "FIELD_ENCRYPTION_KEY",
    "FIELD_HASH_KEY",
  ]);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (blocked.has(lowerKey)) continue;
    // No guardar textos largos de CV en metadata de linaje
    if (typeof value === "string" && value.length > 2000) {
      result[key] = value.slice(0, 500) + "...[truncated]";
      continue;
    }
    result[key] = value;
  }
  return result;
}

/**
 * Recupera el linaje completo de un sujeto, ordenado cronológicamente.
 * Útil para solicitudes ARCO de acceso y para auditorías.
 */
export async function getLineageForSubject(
  subjectType: LineageSubjectType,
  subjectId: string,
): Promise<DataLineageEvent[]> {
  const snapshot = await dataLineageEvents()
    .where("subject_type", "==", subjectType)
    .where("subject_id", "==", subjectId)
    .orderBy("created_at", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as DataLineageEvent);
}

/**
 * Recupera el último evento de linaje de un sujeto.
 * Útil para encadenar eventos (previous_lineage_id).
 */
export async function getLastLineageEvent(
  subjectType: LineageSubjectType,
  subjectId: string,
): Promise<DataLineageEvent | null> {
  const snapshot = await dataLineageEvents()
    .where("subject_type", "==", subjectType)
    .where("subject_id", "==", subjectId)
    .orderBy("created_at", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as DataLineageEvent;
}

/**
 * Helper para registrar la creación de un dato sensible con encriptación y hash.
 */
export async function logSensitiveDataCreated(
  input: Omit<DataLineageEventInput, "action"> & {
    encrypted?: boolean;
    hashed?: boolean;
    encryption_key_version?: string;
  },
): Promise<{ lineage_id: string }> {
  const { encrypted, hashed, encryption_key_version, ...rest } = input;
  const metadata: Record<string, unknown> = { ...(rest.metadata || {}) };
  if (encrypted) metadata.encrypted = true;
  if (hashed) metadata.hashed = true;
  if (encryption_key_version) metadata.encryption_key_version = encryption_key_version;

  return logDataLineage({
    ...rest,
    action: "created",
    metadata,
  });
}

/**
 * Helper para registrar acceso a datos sensibles.
 */
export async function logSensitiveDataAccessed(
  input: Omit<DataLineageEventInput, "action"> & { access_reason?: string },
): Promise<{ lineage_id: string }> {
  const { access_reason, ...rest } = input;
  return logDataLineage({
    ...rest,
    action: "accessed",
    metadata: {
      ...(rest.metadata || {}),
      ...(access_reason ? { access_reason } : {}),
    },
  });
}

/**
 * Helper para registrar cesión de datos a terceros.
 */
export async function logSensitiveDataShared(
  input: Omit<DataLineageEventInput, "action"> & {
    data_categories?: string[];
    sharing_method?: string;
  },
): Promise<{ lineage_id: string }> {
  const { data_categories, sharing_method, ...rest } = input;
  return logDataLineage({
    ...rest,
    action: "shared",
    metadata: {
      ...(rest.metadata || {}),
      ...(data_categories ? { data_categories } : {}),
      ...(sharing_method ? { sharing_method } : {}),
    },
  });
}
