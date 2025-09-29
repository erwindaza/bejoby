// src/app/api/coaching/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    console.log("📥 Request recibido en /api/coaching:", { name, email });

    // 🔑 Clave de Gemini desde variables de entorno
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("Falta GEMINI_API_KEY en el backend");
    }

    // 🌐 Llamada al endpoint de Gemini (mock si no hay conexión real)
    const res = await fetch("https://api.gemini.com/v1/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        user: name,
        email,
        model: "gemini-1.5-flash",
        prompt: "Bienvenido a BeJoby Coach Virtual, tu asistente laboral.",
      }),
    });

    if (!res.ok) {
      console.error("❌ Gemini respondió con error:", res.status, res.statusText);
      return NextResponse.json(
        { message: "Error conectando con el Coach Virtual." },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log("✅ Respuesta de Gemini:", data);

    return NextResponse.json({
      message: data.reply || `Sesión iniciada para ${name} (${email}) 🚀`,
    });
  } catch (err) {
    console.error("❌ Error interno en /api/coaching:", err);
    return NextResponse.json(
      { message: "Error en el backend de coaching." },
      { status: 500 }
    );
  }
}

// ✅ Opcional: test rápido con GET
export async function GET() {
  return NextResponse.json({ message: "Pong! /api/coaching funcionando 🚀" });
}
