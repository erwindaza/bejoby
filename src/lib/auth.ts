// src/lib/auth.ts — Session management helpers
import { sessions, users } from "./gcp/collections";
import { cookies } from "next/headers";

const SESSION_COOKIE = "bejoby_session";

export interface SessionUser {
  id: string;
  email: string;
  employer_id?: string;
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
    return {
      id: session.user_id,
      email: userData.email,
      employer_id: userData.employer_id,
    };
  } catch {
    return null;
  }
}
