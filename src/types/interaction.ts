// Interaction types for Firestore (emails, notes, status changes)
import { Timestamp } from "@google-cloud/firestore";

export type InteractionType = "email" | "internal_note" | "status_change";

export interface Interaction {
  id: string;
  application_id: string;
  from_user_id: string;
  type: InteractionType;
  subject?: string;
  body: string;
  created_at: Timestamp;
  is_public: boolean; // candidate can see or not
}

export interface CreateInteractionInput {
  application_id: string;
  from_user_id: string;
  type: InteractionType;
  subject?: string;
  body: string;
  is_public?: boolean;
}
