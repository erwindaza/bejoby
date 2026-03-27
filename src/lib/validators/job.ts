// src/lib/validators/job.ts
import { z } from "zod";

export const createJobSchema = z.object({
  employer_id: z.string().min(1, "Employer ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  location: z.string().max(200).default(""),
  salary_range: z.string().max(100).default(""),
  employment_type: z.enum(["full-time", "part-time", "contract", "freelance"]),
  work_mode: z.enum(["remote", "hybrid", "on-site"]).default("on-site"),
  language: z.enum(["es", "en"]),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
});

export const updateJobSchema = createJobSchema.omit({ employer_id: true }).partial();
