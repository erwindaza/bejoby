import { z } from "zod";

export const privacyRequestTypeSchema = z.enum([
  "ACCESS",
  "RECTIFICATION",
  "SUPPRESSION",
  "OPPOSITION",
  "PORTABILITY",
  "BLOCKING",
  "AUTOMATED_DECISION_REVIEW",
]);

export const privacyRequestStatusSchema = z.enum([
  "RECEIVED",
  "IDENTITY_VERIFICATION",
  "BLOCKED_PENDING_REVIEW",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED_WITH_LEGAL_REASON",
]);

export const createPrivacyRequestSchema = z.object({
  request_type: privacyRequestTypeSchema,
  target: z.string().max(200).default("account"),
  description: z.string().max(4000).default(""),
  requested_blocking: z.boolean().default(false),
  correction_payload: z.record(z.string(), z.unknown()).optional(),
});

export const updatePrivacyRequestSchema = z.object({
  status: privacyRequestStatusSchema,
  assigned_to: z.string().max(200).optional(),
  resolution: z.string().max(4000).optional(),
  legal_reason: z.string().max(4000).optional(),
});

export type PrivacyRequestType = z.infer<typeof privacyRequestTypeSchema>;
export type PrivacyRequestStatus = z.infer<typeof privacyRequestStatusSchema>;
