// src/types/candidate.ts
export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  resume_url: string;
  resume_text: string;
  language: "es" | "en";
  // Legal consent
  consent_privacy: boolean;
  consent_data_processing: boolean;
  consent_date: Date;
  created_at: Date;
  updated_at: Date;
}

export type CreateCandidateInput = Omit<Candidate, "id" | "created_at" | "updated_at">;
export type UpdateCandidateInput = Partial<Omit<CreateCandidateInput, "consent_privacy" | "consent_data_processing" | "consent_date">>;
