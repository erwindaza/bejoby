// src/lib/validators/candidate.ts
import { z } from "zod";

export const createCandidateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  phone: z.string().max(30).default(""),
  linkedin: z.string().url("Invalid LinkedIn URL").or(z.literal("")).default(""),
  resume_url: z.string().url("Invalid resume URL").or(z.literal("")).default(""),
  resume_text: z.string().max(50000).default(""),
  language: z.enum(["es", "en"]).default("es"),
  consent_privacy: z.literal(true, { error: "You must accept the privacy policy" }),
  consent_data_processing: z.literal(true, { error: "You must consent to data processing" }),
});

export const updateCandidateSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30),
  linkedin: z.string().url().or(z.literal("")),
  resume_url: z.string().url().or(z.literal("")),
  resume_text: z.string().max(50000),
  language: z.enum(["es", "en"]),
}).partial();
