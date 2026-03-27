// src/app/api/events/route.ts — Log user interactions to Firestore
import { events } from "@/lib/gcp/collections";
import { FieldValue } from "@google-cloud/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.type) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";

    const docRef = events().doc();
    await docRef.set({
      type: body.type,
      page: body.page || "",
      action: body.action || "",
      metadata: body.metadata || {},
      user_agent: userAgent,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Never fail on event logging — just log and return ok
    console.error("[POST /api/events]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true });
  }
}
