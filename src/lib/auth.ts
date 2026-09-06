// src/lib/auth.ts — Session management helpers
import { sessions, users, candidates } from "./gcp/collections";
import { cookies } from "next/headers";

const SESSION_COOKIE = "bejoby_session";

export interface SessionUser {
  id: string;
  email: string;
  employer_id?: string;
  candidate_id?: string;
}

/**
 * Get the current authenticated user from session cookie.
 * Returns null if not authenticated or session expired.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const sessionDoc = await sessions().doc(token).get();
    if (!sessionDoc.exists) return null;

    const session = sessionDoc.data()!;
    const expiresAt = session.expires_at?.toDate
      ? session.expires_at.toDate()
      : new Date(session.expires_at);

    if (expiresAt < new Date()) {
      await sessions().doc(token).delete();
      return null;
    }

    const userDoc = await users().doc(session.user_id).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data()!;
    let candidateId: string | undefined = userData.candidate_id;

    // Auto-link candidate profile by email (same pattern as employer_id linking
    // in verify-code/route.ts) — candidates apply anonymously via a localStorage
    // id, so the link to a logged-in session only exists via matching email.
    if (!candidateId && !userData.employer_id) {
      const candSnapshot = await candidates()
        .where("email", "==", userData.email)
        .limit(1)
        .get();
      if (!candSnapshot.empty) {
        candidateId = candSnapshot.docs[0].id;
        users().doc(session.user_id).update({ candidate_id: candidateId }).catch(() => {});
      }
    }

    return {
      id: session.user_id,
      email: userData.email,
      employer_id: userData.employer_id,
      candidate_id: candidateId,
    };
  } catch {
    return null;
  }
}
