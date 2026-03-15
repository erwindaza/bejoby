// src/types/employer.ts
export interface Employer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  industry: string;
  consent_privacy: boolean;
  consent_date: Date;
  created_at: Date;
  updated_at: Date;
}

export type CreateEmployerInput = Omit<Employer, "id" | "created_at" | "updated_at">;
export type UpdateEmployerInput = Partial<Omit<CreateEmployerInput, "consent_privacy" | "consent_date">>;
