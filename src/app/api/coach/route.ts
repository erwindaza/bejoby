// src/app/api/coach/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, prompt } = await req.json();

    console.log("🤖 Conectando con Gemini:", { name, email, prompt });

    // Aquí usamos tu clave de Gemini desde .env.local
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("🚨 Falta GEMINI_API_KEY en el .env.local");
    }

    // Simulación de llamada a Gemini Flash 2.5
    // 🔥 Cuando tengas la SDK real, reemplazas este fetch
    const fakeReply = `Hola ${name}, soy tu Coach Virtual BeJoby. 🚀`;

    return NextResponse.json({ reply: fakeReply });
  } catch (err) {
    console.error("❌ Error en /api/coach:", err);
    return NextResponse.json(
      { message: "Error conectando con Gemini." },
      { status: 500 }
    );
  }
}
