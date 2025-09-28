import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email } = await req.json();

  try {
    // Conexión a tu API Gemini Flash 2.5
    const res = await fetch("https://api.gemini.com/v1/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: name,
        email,
        model: "gemini-1.5-flash",
        prompt: "Bienvenido a BeJoby Coach Virtual, tu asistente para coaching laboral.",
      }),
    });

    const data = await res.json();
    return NextResponse.json({ message: data.reply || "Sesión iniciada." });
  } catch (err) {
    return NextResponse.json(
      { message: "Error al conectar con Gemini." },
      { status: 500 }
    );
  }
}

