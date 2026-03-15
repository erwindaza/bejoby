// src/types/application.ts
export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  resume_url: string;
  message: string;
  status: ApplicationStatus;
  consent_share_data: boolean;
  created_at: Date;
  updated_at: Date;
}

export type CreateApplicationInput = Omit<Application, "id" | "status" | "created_at" | "updated_at">;
export type UpdateApplicationInput = { status: ApplicationStatus };
