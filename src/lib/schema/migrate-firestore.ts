#!/usr/bin/env node

/**
 * Firestore Migration Script
 * Adds batch processing and commission fields to existing applications
 * Usage: npx ts-node src/lib/schema/migrate-firestore.ts
 */

import { getFirestore } from "@/lib/gcp/firestore";
import { FieldValue } from "@google-cloud/firestore";
import { buildEncryptedCandidateRecord, encryptApplicationPII } from "@/lib/security/pii";

function collectionName(name: string): string {
  return `${process.env.FIRESTORE_PREFIX || ""}${name}`;
}

async function migrateApplications() {
  const db = getFirestore();
  const applicationsRef = db.collection(collectionName("applications"));

  console.log("[MIGRATE] Starting applications collection migration...");

  try {
    const snapshot = await applicationsRef.get();
    let updated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Skip if already migrated
      if (data.batch_processing_status !== undefined) {
        continue;
      }

      const updates: Record<string, unknown> = {
        batch_processing_status: "pending",
        batch_processing_retry_count: 0,
        batch_processing_last_error: null,
        ai_cost_logs: [],
        commission_status: "pending",
        commission_amount_clp: 200000,
      };

      if (!data.ai_analysis && data.cv_path) {
        updates.batch_processing_status = "pending";
      } else if (data.ai_analysis) {
        updates.batch_processing_status = "completed";
        updates.batch_processing_completed_at = FieldValue.serverTimestamp();
      }

      if (data.application_pii_encrypted !== true && data.candidate_name && data.candidate_email) {
        Object.assign(updates, encryptApplicationPII({
          candidate_name: String(data.candidate_name || ""),
          candidate_email: String(data.candidate_email || ""),
          resume_url: String(data.resume_url || ""),
          message: String(data.message || ""),
        }), {
          candidate_name: FieldValue.delete(),
          candidate_email: FieldValue.delete(),
          resume_url: FieldValue.delete(),
          message: FieldValue.delete(),
        });
      }
      await applicationsRef.doc(doc.id).update(updates);
      updated++;

      if (updated % 10 === 0) {
        console.log(`[MIGRATE] Updated ${updated} documents...`);
      }
    }

    console.log(`[MIGRATE] ✓ Migration complete: ${updated} documents updated`);
  } catch (err) {
    console.error("[MIGRATE] ✗ Migration failed:", err instanceof Error ? err.message : err);
    throw err;
  }
}

async function migrateCandidates() {
  const db = getFirestore();
  const candidatesRef = db.collection(collectionName("candidates"));

  console.log("[MIGRATE] Starting candidates collection migration...");

  try {
    const snapshot = await candidatesRef.get();
    let updated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Skip if already migrated
      if (data.game_points !== undefined) {
        continue;
      }

      const updates: Record<string, unknown> = {
        game_points: 0,
        badges: [],
      };

      if (data.pii_encrypted !== true && data.name && data.email) {
        Object.assign(updates, buildEncryptedCandidateRecord({
          name: String(data.name || ""),
          email: String(data.email || ""),
          phone: String(data.phone || ""),
          linkedin: String(data.linkedin || ""),
          resume_url: String(data.resume_url || ""),
          resume_text: String(data.resume_text || ""),
        }), {
          name: FieldValue.delete(),
          email: FieldValue.delete(),
          phone: FieldValue.delete(),
          linkedin: FieldValue.delete(),
          resume_url: FieldValue.delete(),
          resume_text: FieldValue.delete(),
        });
      }
      await candidatesRef.doc(doc.id).update(updates);
      updated++;

      if (updated % 10 === 0) {
        console.log(`[MIGRATE] Updated ${updated} documents...`);
      }
    }

    console.log(`[MIGRATE] ✓ Migration complete: ${updated} documents updated`);
  } catch (err) {
    console.error("[MIGRATE] ✗ Migration failed:", err instanceof Error ? err.message : err);
    throw err;
  }
}

async function main() {
  console.log("[MIGRATE] BeJoby Firestore Migration\n");

  try {
    await migrateApplications();
    console.log();
    await migrateCandidates();
    console.log("\n[MIGRATE] ✓ All migrations completed successfully");
    process.exit(0);
  } catch {
    console.error("\n[MIGRATE] ✗ Migration failed");
    process.exit(1);
  }
}

main();
