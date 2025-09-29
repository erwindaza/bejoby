// src/app/api/coaching/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.name || !body.email) {
      return NextResponse.json(
        { message: "Faltan parámetros: name y email son obligatorios." },
        { status: 400 }
      );
    }

    const { name, email } = body;
    console.log("📥 [API /coaching] Datos recibidos:", { name, email });

    // 🔑 Clave de Gemini desde variables de entorno
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error("❌ No existe GEMINI_API_KEY en el entorno");
      return NextResponse.json(
        { message: "Error de configuración: falta GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    // 🌐 Llamada al endpoint de Gemini (puedes reemplazar el mock)
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
      const text = await res.text();
      console.error("❌ [API /coaching] Gemini error:", res.status, text);
      return NextResponse.json(
        { message: "Error conectando con el Coach Virtual." },
        { status: 502 }
      );
    }

    const data = await res.json();
    console.log("✅ [API /coaching] Respuesta Gemini:", data);

    return NextResponse.json({
      message: data.reply || `Sesión iniciada para ${name} (${email}) 🚀`,
    });
  } catch (err) {
    console.error("❌ [API /coaching] Error interno:", err);
    return NextResponse.json(
      { message: "Error en el backend de coaching." },
      { status: 500 }
    );
  }
}

// ✅ Test rápido con GET
export async function GET() {
  return NextResponse.json({ message: "Pong! /api/coaching funcionando 🚀" });
}
