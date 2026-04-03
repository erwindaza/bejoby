// src/app/api/coach/route.ts — Career coaching powered by Gemini
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `Eres el Coach Virtual de BeJoby, un experto en empleabilidad y desarrollo profesional para Latinoamérica.
Tu rol es ayudar a candidatos con:
- Preparación para entrevistas
- Revisión y mejora de CV
- Estrategia de búsqueda de empleo
- Negociación salarial
- Desarrollo de carrera profesional
- Habilidades blandas y networking

Responde de forma profesional pero cercana, con consejos accionables y concretos.
Siempre en el idioma que use el usuario (español o inglés).
Mantén las respuestas concisas (máximo 3-4 párrafos).
Si te piden algo fuera de tu área, redirige amablemente al tema laboral.`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.prompt) {
      return NextResponse.json({ message: "Se requiere un prompt." }, { status: 400 });
    }

    const { name, prompt } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ message: "Error de configuración del servidor." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const userContext = name ? `El usuario se llama ${name}. ` : "";
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Entendido. Estoy listo para ayudarte." }] },
        { role: "user", parts: [{ text: `${userContext}${prompt}` }] },
      ],
    });

    const reply = result.response.text().trim();

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[POST /api/coach]", err);
    return NextResponse.json({ message: "Error conectando con el Coach Virtual." }, { status: 500 });
  }
}
