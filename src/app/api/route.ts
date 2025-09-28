// src/app/api/subscribe/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body?.email || "").toString().trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
    }

    // Aquí puedes integrar con tu DB / Supabase / Mailchimp / SendGrid
    // Por ahora hacemos un console.log para que lo veas en los logs de Vercel
    console.log("[subscribe] nuevo email:", email);

    // devolver éxito
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscribe error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
