// src/lib/compliance/arco-handler.ts
// Orquestador mínimo viable de derechos ARCO para BeJoby (coach laboral).
// Acceso, Rectificación, Cancelación, Oposición, Bloqueo, Portabilidad.

import { FieldValue } from "@google-cloud/firestore";
import { users, privacyRequests } from "@/lib/gcp/collections";
import { decryptUserPII } from "@/lib/security/pii";
import { logAuditEvent } from "./audit";
import { logDataLineage } from "./data-lineage";
import { canDeleteCandidate } from "./retention";
import type { PrivacyRequestType } from "@/lib/validators/privacy-request";

export interface ARCOExportPackage {
  export_id: string;
  generated_at: string;
  user_id: string;
  profile: Record<string, unknown> | null;
  consents: Record<string, unknown>[];
  privacy_requests: Record<string, unknown>[];
  version: string;
}

/**
 * Genera un paquete portable de datos del usuario (derecho de acceso/portabilidad).
 * Incluye solo datos almacenados por BeJoby. El historial de chat no se almacena.
 */
export async function exportUserData(userId: string): Promise<ARCOExportPackage> {
  const [userDoc, requestsSnap] = await Promise.all([
    users().doc(userId).get(),
    privacyRequests().where("user_id", "==", userId).get(),
  ]);

  const profile = userDoc.exists
    ? decryptUserPII(userDoc.data() as Record<string, unknown>)
    : null;

  const safeProfile = profile
    ? Object.fromEntries(
        Object.entries(profile).filter(([key]) =>
          !["session_token", "password_hash", "otp"].includes(key),
        ),
      )
    : null;

  const requests = requestsSnap.docs.map((doc) => ({
    id: doc.id,
    request_type: doc.data().request_type,
    status: doc.data().status,
    created_at: doc.data().received_at,
    completed_at: doc.data().completed_at,
  }));

  const exportId = `${userId}-${Date.now()}`;

  await logDataLineage({
    subject_type: "candidate", // mantenemos candidate como subject_type genérico de usuario
    subject_id: userId,
    action: "exported",
    actor_id: userId,
    actor_type: "user",
    legal_basis: "legal_obligation",
    purpose_code: "arco_portability",
    source_system: "exportUserData",
    metadata: { export_id: exportId },
  });

  await logAuditEvent({
    type: "DATA_EXPORT",
    actor_id: userId,
    subject_id: userId,
    subject_type: "user",
    purpose: "ARCO portability/access",
    metadata: { export_id: exportId },
  });

  return {
    export_id: exportId,
    generated_at: new Date().toISOString(),
    user_id: userId,
    profile: safeProfile,
    consents: [], // se completan en el endpoint si se desea
    privacy_requests: requests,
    version: "1.0",
  };
}

export interface RectificationInput {
  field: string;
  new_value: unknown;
  reason?: string;
}

/**
 * Aplica una rectificación simple a un campo del perfil del usuario.
 * Guarda la versión anterior en el audit log.
 */
export async function rectifyUserField(
  userId: string,
  input: RectificationInput,
): Promise<void> {
  const docRef = users().doc(userId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("User not found");

  const previousValue = doc.get(input.field);

  await docRef.update({
    [input.field]: input.new_value,
    updated_at: FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    type: "PROFILE_UPDATE",
    actor_id: userId,
    subject_id: userId,
    subject_type: "user",
    purpose: "ARCO rectification",
    metadata: {
      field: input.field,
      previous_value_type: typeof previousValue,
      reason: input.reason || null,
    },
  });

  await logDataLineage({
    subject_type: "candidate",
    subject_id: userId,
    field_path: input.field,
    action: "rectified",
    actor_id: userId,
    actor_type: "user",
    legal_basis: "legal_obligation",
    purpose_code: "arco_rectification",
    source_system: "rectifyUserField",
    metadata: { reason: input.reason || null },
  });
}

export interface DeletionResult {
  deleted: boolean;
  reasons: string[];
  soft_deleted_at?: string;
}

/**
 * Inicia la eliminación de un usuario, respetando retención legal.
 * Si no es elegible, retorna los motivos.
 * Si es elegible, hace soft-delete marcando deleted_at.
 */
export async function requestUserDeletion(
  userId: string,
  lastActivityAt?: Date,
): Promise<DeletionResult> {
  const docRef = users().doc(userId);
  const doc = await docRef.get();
  if (!doc.exists) return { deleted: false, reasons: ["Usuario no encontrado."] };

  const pendingRequestsSnap = await privacyRequests()
    .where("user_id", "==", userId)
    .where("status", "in", ["RECEIVED", "IDENTITY_VERIFICATION", "IN_PROGRESS", "BLOCKED_PENDING_REVIEW"])
    .get();

  const activity = lastActivityAt || doc.data()?.updated_at?.toDate?.() || new Date();

  const { eligible, reasons } = canDeleteCandidate(
    activity,
    false, // no hay postulaciones en MVP mínimo
    !pendingRequestsSnap.empty,
    false,
  );

  if (!eligible) {
    return { deleted: false, reasons };
  }

  await docRef.update({
    deleted_at: FieldValue.serverTimestamp(),
    deletion_requested_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    type: "DATA_DELETION_REQUEST",
    actor_id: userId,
    subject_id: userId,
    subject_type: "user",
    purpose: "ARCO suppression",
  });

  await logDataLineage({
    subject_type: "candidate",
    subject_id: userId,
    action: "deleted",
    actor_id: userId,
    actor_type: "user",
    legal_basis: "legal_obligation",
    purpose_code: "arco_suppression",
    source_system: "requestUserDeletion",
  });

  return {
    deleted: true,
    reasons: [],
    soft_deleted_at: new Date().toISOString(),
  };
}

/**
 * Marca oposición/bloqueo sobre una finalidad específica.
 * No elimina datos; detiene futuros tratamientos para esa finalidad.
 */
export async function blockProcessingForPurpose(
  userId: string,
  purposeCode: string,
  requestType: PrivacyRequestType,
): Promise<void> {
  await users().doc(userId).update({
    [`blocks.${purposeCode}`]: {
      blocked_at: FieldValue.serverTimestamp(),
      request_type: requestType,
    },
    updated_at: FieldValue.serverTimestamp(),
  });

  await logDataLineage({
    subject_type: "candidate",
    subject_id: userId,
    action: "blocked",
    actor_id: userId,
    actor_type: "user",
    legal_basis: "legal_obligation",
    purpose_code: purposeCode,
    source_system: "blockProcessingForPurpose",
    metadata: { request_type: requestType },
  });
}
