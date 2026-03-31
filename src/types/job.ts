// src/types/job.ts
export type EmploymentType = "full-time" | "part-time" | "contract" | "freelance";
export type JobStatus = "draft" | "published" | "closed";
export type WorkMode = "remote" | "hybrid" | "on-site";
export type Language = "es" | "en";

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  company_display?: string;
  description: string;
  location: string;
  salary_range: string;
  seniority?: string;
  experience_years?: string;
  employment_type: EmploymentType;
  work_mode?: WorkMode;
  language: Language;
  status: JobStatus;
  stack?: Record<string, string[]>;
  requirements_mandatory?: string[];
  requirements_nice_to_have?: string[];
  responsibilities?: string[];
  what_we_offer?: string[];
  search_tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export type CreateJobInput = Omit<Job, "id" | "created_at" | "updated_at">;
export type UpdateJobInput = Partial<Omit<CreateJobInput, "employer_id">>;
