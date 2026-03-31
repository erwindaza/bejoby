// src/lib/gcp/collections.ts
// Firestore collection helpers with dev/prod prefix support
import { getFirestore } from "./firestore";
import { CollectionReference } from "@google-cloud/firestore";

/**
 * Returns the collection prefix based on environment.
 * In dev: "dev_" prefix → dev_employers, dev_jobs, etc.
 * In prod: no prefix → employers, jobs, etc.
 */
function getPrefix(): string {
  return process.env.FIRESTORE_PREFIX || "";
}

/** Get a collection reference with the appropriate prefix */
function collection(name: string): CollectionReference {
  const db = getFirestore();
  return db.collection(`${getPrefix()}${name}`);
}

// Named collection accessors
export const employers = () => collection("employers");
export const jobs = () => collection("jobs");
export const candidates = () => collection("candidates");
export const applications = () => collection("applications");
export const contactForms = () => collection("contact_forms");
export const events = () => collection("events");
export const users = () => collection("users");
export const sessions = () => collection("sessions");
export const otps = () => collection("otps");
export const aiAuditLog = () => collection("ai_audit_log");
export const dataRequests = () => collection("data_requests");
