import { FieldValue } from "@google-cloud/firestore";
import { privacyRequests } from "@/lib/gcp/collections";
import { logAuditEvent } from "./audit";
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
