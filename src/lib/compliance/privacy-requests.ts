import { FieldValue } from "@google-cloud/firestore";
import { privacyRequests } from "@/lib/gcp/collections";
import { logAuditEvent } from "./audit";
import { logDataLineage } from "./data-lineage";
import type { PrivacyRequestStatus, PrivacyRequestType } from "@/lib/validators/privacy-request";

export interface CreatePrivacyRequestInput {
  user_id: string;
  email: string;
  request_type: PrivacyRequestType;
  target: string;
  description?: string;
  requested_blocking?: boolean;
  correction_payload?: Record<string, unknown>;
}

function initialStatus(type: PrivacyRequestType, requestedBlocking: boolean): PrivacyRequestStatus {
  if (type === "BLOCKING" || requestedBlocking) return "BLOCKED_PENDING_REVIEW";
  return "RECEIVED";
}

export async function createPrivacyRequest(
  input: CreatePrivacyRequestInput,
): Promise<{ request_id: string; status: PrivacyRequestStatus }> {
  const docRef = privacyRequests().doc();
  const status = initialStatus(input.request_type, Boolean(input.requested_blocking));

  await docRef.set({
    request_id: docRef.id,
    user_id: input.user_id,
    email: input.email.trim().toLowerCase(),
    request_type: input.request_type,
    target: input.target,
    description: input.description || "",
    requested_blocking: Boolean(input.requested_blocking),
    correction_payload: input.correction_payload || null,
    identity_verified_at: null,
    assigned_to: null,
    status,
    systems_affected: [],
    processors_affected: [],
    resolution: null,
    legal_reason: null,
    completed_at: null,
    received_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    type: input.request_type === "SUPPRESSION" ? "DATA_DELETION_REQUEST" : "PRIVACY_REQUEST",
    actor_id: input.user_id,
    actor_email: input.email,
    subject_id: docRef.id,
    subject_type: "privacy_request",
    purpose: input.request_type,
    metadata: {
      target: input.target,
      requested_blocking: Boolean(input.requested_blocking),
      status,
    },
  });

  return { request_id: docRef.id, status };
}

export interface UpdatePrivacyRequestInput {
  status?: PrivacyRequestStatus;
  assigned_to?: string;
  resolution?: string;
  legal_reason?: string;
  systems_affected?: string[];
  processors_affected?: string[];
  identity_verified?: boolean;
}

export async function updatePrivacyRequest(
  requestId: string,
  input: UpdatePrivacyRequestInput,
  adminId?: string,
): Promise<void> {
  const docRef = privacyRequests().doc(requestId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("Privacy request not found");

  const update: Record<string, unknown> = {
    updated_at: FieldValue.serverTimestamp(),
  };

  if (input.status) update.status = input.status;
  if (input.assigned_to !== undefined) update.assigned_to = input.assigned_to || null;
  if (input.resolution !== undefined) update.resolution = input.resolution || null;
  if (input.legal_reason !== undefined) update.legal_reason = input.legal_reason || null;
  if (input.systems_affected !== undefined) update.systems_affected = input.systems_affected;
  if (input.processors_affected !== undefined) update.processors_affected = input.processors_affected;
  if (input.identity_verified) update.identity_verified_at = FieldValue.serverTimestamp();
  if (input.status === "COMPLETED" || input.status === "REJECTED_WITH_LEGAL_REASON") {
    update.completed_at = FieldValue.serverTimestamp();
  }

  await docRef.update(update);

  await logAuditEvent({
    type: "PRIVACY_REQUEST",
    actor_id: adminId || "system",
    subject_id: requestId,
    subject_type: "privacy_request",
    purpose: "update",
    metadata: {
      new_status: input.status,
      assigned_to: input.assigned_to,
      legal_reason: input.legal_reason,
    },
  });
}

/**
 * Marca una solicitud ARCO como completada y registra linaje.
 */
export async function completePrivacyRequest(
  requestId: string,
  resolution: string,
  adminId?: string,
): Promise<void> {
  await updatePrivacyRequest(
    requestId,
    { status: "COMPLETED", resolution },
    adminId,
  );

  const doc = await privacyRequests().doc(requestId).get();
  const data = doc.data();
  if (!data) return;

  await logDataLineage({
    subject_type: "privacy_request",
    subject_id: requestId,
    action: "accessed",
    actor_id: adminId || "system",
    actor_type: adminId ? "admin" : "system",
    legal_basis: "legal_obligation",
    purpose_code: data.request_type as string,
    source_system: "completePrivacyRequest",
    metadata: { resolution },
  });
}

/**
 * Rechaza una solicitud ARCO con fundamento legal.
 */
export async function rejectPrivacyRequest(
  requestId: string,
  legalReason: string,
  adminId?: string,
): Promise<void> {
  await updatePrivacyRequest(
    requestId,
    { status: "REJECTED_WITH_LEGAL_REASON", legal_reason: legalReason },
    adminId,
  );
}
