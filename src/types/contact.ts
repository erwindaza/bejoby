// src/types/contact.ts
export type ContactSource = "contact" | "coaching" | "subscribe";

export interface ContactForm {
  id: string;
  name: string;
  email: string;
  message: string;
  source: ContactSource;
  created_at: Date;
}

export type CreateContactInput = Omit<ContactForm, "id" | "created_at">;
