// src/app/api/coaching/route.ts — Coaching session initializer with Gemini welcome
import { NextRequest, NextResponse } from "next/server";
import { getGenerativeModel } from "@/lib/ai/ai-client";
import { guardOrigin } from "@/lib/security/origin-guard";

export async function POST(req: NextRequest) {
  const blocked = await guardOrigin(req, "/api/coaching");
  if (blocked) return blocked;

  try {
    const body = await req.json().catch(() => null);
    if (!body?.name || !body?.email) {
      return NextResponse.json(
        { message: "Faltan parámetros: name y email son obligatorios." },
        { status: 400 }
      );
    }

    const { name } = body;
    const model = getGenerativeModel("COACH");

    const result = await model.generateContent(
      `Eres el Coach Virtual de BeJoby, experto en empleabilidad para Latinoamérica.
Genera un breve mensaje de bienvenida (3-4 líneas) para ${name} que acaba de iniciar una sesión de coaching.
Sé motivador, profesional y cercano. Pregúntale en qué puedes ayudarle hoy.
Responde solo el mensaje, sin encabezados ni formato markdown.`
    );

    const reply = result.response.text().trim();

    return NextResponse.json({ message: reply });
  } catch (err) {
    console.error("[POST /api/coaching]", err);
    return NextResponse.json(
      { message: "Error en el backend de coaching." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Coaching API operational" });
}
