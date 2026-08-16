import { applications } from "@/lib/gcp/collections";
import { analyzeApplication } from "@/lib/ai/match-analysis";
import { FieldValue } from "@google-cloud/firestore";

export interface BatchProcessingState {
  status: "pending" | "processing" | "completed" | "failed";
  retry_count: number;
  last_error?: string;
  processed_at?: string;
  expires_at?: string;
}

/**
 * Process a batch of pending applications for CV analysis and scoring.
 * Idempotent — only processes applications with status "pending" or failed with retry_count < 3.
 * Called by Cloud Scheduler or cron job (not realtime).
 */
export async function processPendingApplications(maxPerBatch: number = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const startTime = Date.now();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    // Fetch applications that need analysis
    const snapshot = await applications()
      .where("ai_analysis", "==", null)
      .where("cv_path", "!=", null)
      .where("batch_processing_status", "in", ["pending", "retry"])
      .limit(maxPerBatch)
      .get();

    console.log(
      `[BATCH] Found ${snapshot.docs.length} applications pending CV analysis`,
    );

    for (const doc of snapshot.docs) {
      const appId = doc.id;
      const appData = doc.data() as Record<string, unknown>;

      try {
        // Mark as processing
        await applications().doc(appId).update({
          batch_processing_status: "processing",
          batch_processing_started_at: FieldValue.serverTimestamp(),
        });

        // Run analysis
        console.log(`[BATCH] Analyzing application ${appId}...`);
        const result = await analyzeApplication(appId);

        if (result) {
          // Success — update with analysis and mark complete
          await applications().doc(appId).update({
            batch_processing_status: "completed",
            batch_processing_completed_at: FieldValue.serverTimestamp(),
            batch_processing_retry_count: 0,
            batch_processing_last_error: null,
          });
          succeeded++;
          console.log(
            `[BATCH] ✓ Completed application ${appId} with score ${result.score}`,
          );
        } else {
          // Analysis returned null — mark as retriable
          const retryCount = (appData.batch_processing_retry_count as number) || 0;
          if (retryCount < 3) {
            await applications().doc(appId).update({
              batch_processing_status: "retry",
              batch_processing_retry_count: retryCount + 1,
              batch_processing_last_error: "Analysis returned null",
            });
            console.warn(
              `[BATCH] ⚠ Retry ${retryCount + 1}/3 for application ${appId}`,
            );
          } else {
            await applications().doc(appId).update({
              batch_processing_status: "failed",
              batch_processing_last_error: "Max retries exceeded",
            });
            console.error(`[BATCH] ✗ Failed application ${appId} after 3 retries`);
          }
        }
        processed++;
      } catch (err) {
        // Catch all errors per application — do not block the batch
        const errorMsg = err instanceof Error ? err.message : String(err);
        const retryCount = (appData.batch_processing_retry_count as number) || 0;

        if (retryCount < 3) {
          await applications().doc(appId).update({
            batch_processing_status: "retry",
            batch_processing_retry_count: retryCount + 1,
            batch_processing_last_error: errorMsg.slice(0, 200),
          });
          console.warn(
            `[BATCH] ⚠ Retry ${retryCount + 1}/3 for application ${appId}: ${errorMsg}`,
          );
        } else {
          await applications().doc(appId).update({
            batch_processing_status: "failed",
            batch_processing_last_error: errorMsg.slice(0, 200),
          });
          console.error(
            `[BATCH] ✗ Failed application ${appId} after 3 retries: ${errorMsg}`,
          );
        }
        failed++;
        processed++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[BATCH] Summary: processed=${processed}, succeeded=${succeeded}, failed=${failed}, elapsed=${elapsed}ms`,
    );

    return { processed, succeeded, failed };
  } catch (err) {
    console.error("[BATCH] Unrecoverable error:", err instanceof Error ? err.message : err);
    throw err;
  }
}

/**
 * Mark an application as ready for submission to a partner.
 * Called after game state indicates the candidate is ready (profile_completion >= 80, cv_path exists, consent given).
 */
export async function markApplicationReadyForSubmission(
  applicationId: string,
): Promise<void> {
  await applications().doc(applicationId).update({
    ready_for_partner_submission: true,
    ready_for_submission_at: FieldValue.serverTimestamp(),
  });
}

/**
 * Clear batch processing state for a single application (useful for manual retries).
 */
export async function resetBatchProcessingState(applicationId: string): Promise<void> {
  await applications().doc(applicationId).update({
    batch_processing_status: "pending",
    batch_processing_retry_count: 0,
    batch_processing_last_error: null,
  });
}
