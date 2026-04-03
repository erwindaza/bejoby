// src/app/api/coaching/route.ts — Coaching session initializer with Gemini welcome
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.name || !body?.email) {
      return NextResponse.json(
        { message: "Faltan parámetros: name y email son obligatorios." },
        { status: 400 }
      );
    }

    const { name } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "Error de configuración del servidor." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
