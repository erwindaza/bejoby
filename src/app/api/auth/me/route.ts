// src/app/api/auth/me/route.ts — Get current user + update user data
import { sessions, users } from "@/lib/gcp/collections";
import { success, error } from "@/lib/utils/api-response";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bejoby_session")?.value;
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

  const userData = userDoc.data() as { email: string; employer_id?: string };
  return { id: session.user_id, ...userData };
}

// GET /api/auth/me — Return current session user
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return error("Not authenticated", 401);

    return success({
      user_id: user.id,
      email: user.email,
      employer_id: user.employer_id || null,
    });
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    return error("Server error", 500);
  }
}

// PATCH /api/auth/me — Update user (e.g. link employer_id)
export async function PATCH(req: Request) {
  try {
    const user = await getUser();
    if (!user) return error("Not authenticated", 401);

    const body = await req.json().catch(() => null);
    if (!body) return error("Invalid request body");

    const updates: Record<string, unknown> = {};
    if (body.employer_id && typeof body.employer_id === "string") {
      updates.employer_id = body.employer_id;
    }

    if (Object.keys(updates).length === 0) {
      return error("Nothing to update");
    }

    await users().doc(user.id).update(updates);

    return success({
      user_id: user.id,
      email: user.email,
      employer_id: updates.employer_id || user.employer_id || null,
    });
  } catch (err) {
    console.error("[PATCH /api/auth/me]", err);
    return error("Server error", 500);
  }
}
