// src/lib/validators/job.ts
import { z } from "zod";

export const createJobSchema = z.object({
  employer_id: z.string().min(1, "Employer ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().max(300).optional(),
  slug: z.string().max(200).optional(),
  company_display: z.string().max(200).default("Empresa confidencial — Sector Tecnología"),
  description: z.string().min(1, "Description is required").max(10000),
  location: z.string().max(200).default(""),
  salary_range: z.string().max(100).default(""),
  seniority: z.string().max(100).optional(),
  experience_years: z.string().max(20).optional(),
  employment_type: z.enum(["full-time", "part-time", "contract", "freelance"]),
  work_mode: z.enum(["remote", "hybrid", "on-site"]).default("on-site"),
  language: z.enum(["es", "en"]),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  stack: z.record(z.string(), z.array(z.string())).optional(),
  requirements_mandatory: z.array(z.string()).optional(),
  requirements_nice_to_have: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  what_we_offer: z.array(z.string()).optional(),
  search_tags: z.array(z.string().max(50)).max(100).optional(),
});

// For updates: all fields optional, no defaults (only update what's provided)
export const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).optional(),
  slug: z.string().max(200).optional(),
  company_display: z.string().max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  location: z.string().max(200).optional(),
  salary_range: z.string().max(100).optional(),
  seniority: z.string().max(100).optional(),
  experience_years: z.string().max(20).optional(),
  employment_type: z.enum(["full-time", "part-time", "contract", "freelance"]).optional(),
  work_mode: z.enum(["remote", "hybrid", "on-site"]).optional(),
  language: z.enum(["es", "en"]).optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  stack: z.record(z.string(), z.array(z.string())).optional(),
  requirements_mandatory: z.array(z.string()).optional(),
  requirements_nice_to_have: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  what_we_offer: z.array(z.string()).optional(),
  search_tags: z.array(z.string().max(50)).max(100).optional(),
});
