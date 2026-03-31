// src/app/api/admin/retention/route.ts — Data retention policy enforcement (Ley 21.719)
// Triggered via cron or manual call. Protected by admin secret.
import { applications, sessions, otps, dataRequests, users, candidates } from "@/lib/gcp/collections";
import { success, error, serverError } from "@/lib/utils/api-response";
import { Storage } from "@google-cloud/storage";
import { parseServiceAccountKey } from "@/lib/gcp/firestore";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const CV_BUCKET = process.env.GCS_CV_BUCKET || "bejoby-cvs";

// Retention periods
const SESSION_MAX_AGE_DAYS = 30;
const OTP_MAX_AGE_HOURS = 1;
const CV_MAX_AGE_DAYS = 730; // 2 years
const DELETION_GRACE_DAYS = 30;

// POST /api/admin/retention — Run retention cleanup
export async function POST(req: Request) {
  try {
    // Auth via secret header (admin-only endpoint)
    const authHeader = req.headers.get("x-admin-secret");
    if (!ADMIN_SECRET || authHeader !== ADMIN_SECRET) {
      return error("Unauthorized", 403);
    }

    const results: Record<string, number> = {};

    // 1. Purge expired sessions
    const sessionCutoff = new Date(Date.now() - SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const expiredSessions = await sessions().where("expires_at", "<", sessionCutoff).get();
    for (const doc of expiredSessions.docs) {
      await doc.ref.delete();
    }
    results.expired_sessions_deleted = expiredSessions.size;

    // 2. Purge expired OTPs
    const otpCutoff = new Date(Date.now() - OTP_MAX_AGE_HOURS * 60 * 60 * 1000);
    const expiredOtps = await otps().where("created_at", "<", otpCutoff).get();
    for (const doc of expiredOtps.docs) {
      await doc.ref.delete();
    }
    results.expired_otps_deleted = expiredOtps.size;

    // 3. Process pending deletion requests past grace period
    const deletionCutoff = new Date(Date.now() - DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
    const pendingDeletions = await dataRequests()
      .where("type", "==", "deletion")
      .where("status", "==", "pending")
      .where("requested_at", "<", deletionCutoff)
      .get();

    let usersDeleted = 0;
    for (const doc of pendingDeletions.docs) {
      const data = doc.data();
      try {
        // Delete user document
        if (data.user_id) {
          await users().doc(data.user_id).delete();
        }

        // Delete candidate record
        if (data.email) {
          const candSnap = await candidates().where("email", "==", data.email).get();
          for (const cd of candSnap.docs) await cd.ref.delete();
        }

        // Delete CVs from GCS
        if (data.email) {
          const appSnap = await applications().where("candidate_email", "==", data.email).get();
          for (const appDoc of appSnap.docs) {
            const appData = appDoc.data();
            if (appData.cv_path) {
              try {
                await getStorage().bucket(CV_BUCKET).file(appData.cv_path).delete();
              } catch { /* file might already be gone */ }
            }
            await appDoc.ref.delete();
          }
        }

        // Mark deletion as completed
        await doc.ref.update({ status: "completed", completed_at: new Date().toISOString() });
        usersDeleted++;
      } catch (err) {
        console.error(`[Retention] Failed to delete user ${data.user_id}:`, err);
        await doc.ref.update({ status: "error", error: String(err) });
      }
    }
    results.users_deleted = usersDeleted;

    // 4. Flag old CVs (> 2 years since last application activity)
    const cvCutoff = new Date(Date.now() - CV_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const oldApps = await applications().where("created_at", "<", cvCutoff).get();
    let oldCvsCount = 0;
    for (const doc of oldApps.docs) {
      const data = doc.data();
      if (data.cv_path && !data.cv_retention_notified) {
        // Mark for notification — don't auto-delete without notice
        await doc.ref.update({ cv_retention_notified: true, cv_retention_flag_date: new Date().toISOString() });
        oldCvsCount++;
      }
    }
    results.old_cvs_flagged = oldCvsCount;

    return success({ message: "Retention policy executed", results });
  } catch (err) {
    console.error("[POST /api/admin/retention]", err);
    return serverError();
  }
}

function getStorage(): Storage {
  const projectId = process.env.GCP_PROJECT_ID;
  const keyRaw = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (!projectId || !keyRaw) throw new Error("Missing GCP credentials");

  const credentials = parseServiceAccountKey(keyRaw);
  const privateKey = (credentials.private_key || "").replace(/\\n/g, "\n");

  return new Storage({
    projectId,
    credentials: { client_email: credentials.client_email, private_key: privateKey },
  });
}
