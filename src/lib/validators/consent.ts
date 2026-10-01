import { z } from "zod";

export const consentTypeSchema = z.enum([
  "coach_usage",
  "profile_processing",
  "ai_processing",
  "marketing_optional",
  "donation",
  "other",
]);

export const createConsentSchema = z.object({
  consent_type: consentTypeSchema,
  purpose: z.string().min(5).max(500),
  policy_version: z.string().min(1).max(50),
  consent_text_snapshot: z.string().min(20).max(8000),
  accepted: z.literal(true),
});

export type ConsentType = z.infer<typeof consentTypeSchema>;
