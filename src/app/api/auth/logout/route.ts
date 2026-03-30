// src/app/api/auth/logout/route.ts — Destroy session
import { sessions } from "@/lib/gcp/collections";
import { success } from "@/lib/utils/api-response";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("bejoby_session")?.value;

    if (token) {
      await sessions().doc(token).delete().catch(() => {});
    }

    cookieStore.set("bejoby_session", "", { maxAge: 0, path: "/" });

    return success({ loggedOut: true });
  } catch {
    // Even on error, clear the cookie
    const cookieStore = await cookies();
    cookieStore.set("bejoby_session", "", { maxAge: 0, path: "/" });
    return success({ loggedOut: true });
  }
}
