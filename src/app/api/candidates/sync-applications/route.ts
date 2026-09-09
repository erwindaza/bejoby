// src/app/api/candidates/sync-applications/route.ts
// POST endpoint to manually sync candidate profile with applications
// Used when auto-link in getSessionUser() might have missed a profile

import { getSessionUser } from "@/lib/auth";
import { candidates, users } from "@/lib/gcp/collections";
import { success, error } from "@/lib/utils/api-response";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return error("Unauthorized", 401);

    // Only for candidates (no employer_id)
    if (user.employer_id) return error("This endpoint is for candidates only", 403);

    // If already linked, nothing to do
    if (user.candidate_id) return success({ synced: false, reason: "already_linked" });

    // Try to find candidate by normalized email
    const normalizedEmail = user.email.toLowerCase().trim();
    const candSnapshot = await candidates()
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (candSnapshot.empty) {
      console.log(`[SYNC] No candidate found for email=${user.email}`);
      return success({ synced: false, reason: "no_candidate_found" });
    }

    const candidateId = candSnapshot.docs[0].id;

    // Link the candidate to the user
    await users().doc(user.id).update({ candidate_id: candidateId });

    console.log(`[SYNC-SUCCESS] email=${user.email} → candidate_id=${candidateId}`);

    return success({
      synced: true,
      candidate_id: candidateId,
    });
  } catch (err) {
    console.error("[POST /api/candidates/sync-applications]", err);
    return error("Internal server error", 500);
  }
}
