// Transaction types for Firestore (payments, feature purchases)
import { Timestamp } from "@google-cloud/firestore";

export type TransactionType =
  | "publish_job"
  | "featured_upgrade"
  | "homepage"
  | "profile_upgrade"
  | "featured_renewal";

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export type PaymentMethod = "credit_card" | "paypal" | "vtex_checkout";

export interface Transaction {
  id: string;
  employer_id: string;
  type: TransactionType;
  amount: number;
  currency: string; // USD, CLP, etc
  status: TransactionStatus;
  created_at: Timestamp;
  completed_at?: Timestamp;
  payment_method?: PaymentMethod;
  vtex_order_id?: string;
  related_entity_id?: string; // ref to job_posting
  description?: string;
}

export interface CreateTransactionInput {
  employer_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  payment_method?: PaymentMethod;
  related_entity_id?: string;
  description?: string;
}

export interface UpdateTransactionInput {
  status?: TransactionStatus;
  completed_at?: Timestamp;
  vtex_order_id?: string;
}
