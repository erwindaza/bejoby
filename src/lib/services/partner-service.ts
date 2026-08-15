import { applications, candidates, partners } from "@/lib/gcp/collections";
import { FieldValue } from "@google-cloud/firestore";
import { trackSubmittedToPartner } from "@/lib/services/game-events-service";
import { decryptCandidatePII, encryptApplicationPII } from "@/lib/security/pii";

export interface PartnerSubmission {
  application_id: string;
  candidate_id: string;
  partner_id: string;
  job_id: string;
  submitted_at: string;
  status: "submitted" | "accepted" | "rejected" | "hired" | "archived";
  commission_status: "pending" | "confirmed" | "paid" | "refunded";
  commission_amount_clp: number;
  notes?: string;
}

/**
 * Submit a candidate to a partner.
 * Guards: consent must be true, candidate profile must be 80%+ complete.
 */
export async function submitCandidateToPartner(
  candidateId: string,
  partnerId: string,
  jobId: string,
): Promise<{
  success: boolean;
  application_id?: string;
  error?: string;
}> {
  try {
    // Fetch candidate
    const candidateDoc = await candidates().doc(candidateId).get();
    if (!candidateDoc.exists) {
      return { success: false, error: "Candidate not found" };
    }
    const candData = decryptCandidatePII(candidateDoc.data() as Record<string, unknown>) as Record<string, unknown>;

    // Guard: consent
    if (candData.consent_shared !== true) {
      return {
        success: false,
        error: "Candidate has not consented to share profile",
      };
    }

    // Guard: profile completeness (rough check)
    const requiredFields = ["email", "phone", "salary_expected", "cv_path"];
    for (const field of requiredFields) {
      if (!candData[field]) {
        return {
          success: false,
          error: `Candidate profile incomplete: missing ${field}`,
        };
      }
    }

    // Fetch partner
    const partnerDoc = await partners().doc(partnerId).get();
    if (!partnerDoc.exists) {
      return { success: false, error: "Partner not found" };
    }
    // Create application/submission
    const appRef = applications().doc();
    const commissionAmount = 200000; // From business rules

    await appRef.set({
      candidate_id: candidateId,
      partner_id: partnerId,
      job_id: jobId,
      ...encryptApplicationPII({
        candidate_name: String(candData.name || ""),
        candidate_email: String(candData.email || ""),
        message: "",
        resume_url: "",
      }),
      status: "submitted",
      commission_status: "pending",
      commission_amount_clp: commissionAmount,
      submitted_to_partner_at: FieldValue.serverTimestamp(),
      cv_path: candData.cv_path,
      consent_shared: true,
      // Batch processing fields
      batch_processing_status: "pending",
      batch_processing_retry_count: 0,
      ai_analysis: null,
    });

    console.log(
      `[PARTNER] Submitted candidate ${candidateId} to partner ${partnerId} for job ${jobId}`,
    );

    // Track game event
    await trackSubmittedToPartner(appRef.id, candidateId);

    return { success: true, application_id: appRef.id };
  } catch (err) {
    console.error(
      "[submitCandidateToPartner]",
      err instanceof Error ? err.message : err,
    );
    return { success: false, error: "Internal error during submission" };
  }
}

/**
 * Update commission status for an application.
 * Transitions: pending -> confirmed -> paid or refunded.
 */
export async function updateCommissionStatus(
  applicationId: string,
  newStatus: "confirmed" | "paid" | "refunded",
  notes?: string,
): Promise<void> {
  await applications().doc(applicationId).update({
    commission_status: newStatus,
    commission_updated_at: FieldValue.serverTimestamp(),
    commission_notes: notes || null,
  });

  console.log(`[COMMISSION] Updated application ${applicationId} to ${newStatus}`);
}

/**
 * Count commissionable candidates for a given period (for revenue tracking).
 */
export async function countCommissionableCandidates(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const snapshot = await applications()
    .where("commission_status", "in", ["confirmed", "paid"])
    .where("submitted_to_partner_at", ">=", startDate)
    .where("submitted_to_partner_at", "<=", endDate)
    .get();

  return snapshot.docs.length;
}

/**
 * Calculate total revenue from commissions for a given period.
 */
export async function calculateRevenueInPeriod(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const snapshot = await applications()
    .where("commission_status", "in", ["confirmed", "paid"])
    .where("submitted_to_partner_at", ">=", startDate)
    .where("submitted_to_partner_at", "<=", endDate)
    .get();

  let total = 0;
  snapshot.docs.forEach((doc) => {
    const appData = doc.data() as Record<string, unknown>;
    total += (appData.commission_amount_clp as number) || 0;
  });

  return total;
}
