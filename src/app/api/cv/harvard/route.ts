// src/app/api/cv/harvard/route.ts
// Convert CV text to Harvard format using Gemini AI
import { NextResponse } from "next/server";
import { buildHarvardPrompt } from "@/lib/cv/harvard-prompt";
import { z } from "zod";
import { getGenerativeModel } from "@/lib/ai/ai-client";

const schema = z.object({
  cv_text: z.string().min(50, "CV text must be at least 50 characters").max(50000),
  language: z.enum(["es", "en"]).default("es"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const model = getGenerativeModel("CV_CONVERTER");
    const prompt = buildHarvardPrompt(parsed.data.cv_text, parsed.data.language);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const harvardCV = response.text();

    return NextResponse.json({
      ok: true,
      data: {
        harvard_cv: harvardCV,
        language: parsed.data.language,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[POST /api/cv/harvard]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate Harvard CV" },
      { status: 500 }
    );
  }
}
