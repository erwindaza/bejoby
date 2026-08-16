// src/app/api/webhooks/email-unsubscribe/route.ts — Unsubscribe from email sequences
import { NextRequest, NextResponse } from "next/server";
import { unsubscribe } from "@/lib/services/email-sequence";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    await unsubscribe(token);

    return NextResponse.json({
      message: "Unsubscribed successfully",
      redirect: "/es",
    });
  } catch (err) {
    console.error("[GET /api/webhooks/email-unsubscribe]", err);
    return NextResponse.json({ error: "Token not found or expired" }, { status: 404 });
  }
}
