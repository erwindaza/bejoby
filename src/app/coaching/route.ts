// src/app/api/coaching/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email } = await req.json();

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `Usuario: ${name} (${email}) quiere iniciar sesión en Coach Virtual.` },
                { text: "Responde con un saludo breve y motivador." },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    return NextResponse.json({
      message:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sesión iniciada con Coach Virtual 🚀",
    });
  } catch (err) {
    console.error("Error en /api/coaching:", err);
    return NextResponse.json({ message: "Error al conectar con Gemini." }, { status: 500 });
  }
}
