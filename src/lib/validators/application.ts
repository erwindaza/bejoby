// src/lib/validators/application.ts
import { z } from "zod";

export const createApplicationSchema = z.object({
  job_id: z.string().min(1, "Job ID is required"),
  candidate_id: z.string().min(1, "Candidate ID is required"),
  candidate_name: z.string().min(1, "Name is required").max(200),
  candidate_email: z.string().email("Invalid email"),
  resume_url: z.string().url("Invalid resume URL").or(z.literal("")).default(""),
  cv_path: z.string().max(500).default(""),
  cv_filename: z.string().max(300).default(""),
  message: z.string().max(2000).default(""),
  consent_share_data: z.literal(true, { error: "You must consent to share your data with the employer" }),
});

export const updateApplicationSchema = z.object({
  status: z.enum(["pending", "reviewed", "accepted", "rejected"]),
});
