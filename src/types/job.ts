// src/types/job.ts
export type EmploymentType = "full-time" | "part-time" | "contract" | "freelance";
export type JobStatus = "draft" | "published" | "closed";
export type Language = "es" | "en";

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: EmploymentType;
  language: Language;
  status: JobStatus;
  created_at: Date;
  updated_at: Date;
}

export type CreateJobInput = Omit<Job, "id" | "created_at" | "updated_at">;
export type UpdateJobInput = Partial<Omit<CreateJobInput, "employer_id">>;
