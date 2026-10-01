// src/lib/validators/employer.ts
import { z } from "zod";

export const employerVerificationStatus = z.enum(["pending", "verified", "rejected"]);

export const createEmployerSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(200),
  contact_name: z.string().min(1, "Contact name is required").max(200),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().max(30).default(""),
  website: z.string().url("Invalid URL").or(z.literal("")).default(""),
  description: z.string().max(2000).default(""),
  industry: z.string().max(100).default(""),
  consent_privacy: z.literal(true, { error: "You must accept the privacy policy" }),
  verification_status: employerVerificationStatus.default("pending"),
});

export const updateEmployerSchema = z.object({
  company_name: z.string().min(1).max(200),
  contact_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30),
  website: z.string().url().or(z.literal("")),
  description: z.string().max(2000),
  industry: z.string().max(100),
}).partial();
