import { AgentSkill } from "../../core/skill";
import type { AgentContext, AgentMessage, SkillResult } from "../../core/types";
import { generateText } from "@/lib/ai/ai-client";

export class CoachSkill extends AgentSkill {
  readonly id = "bejoby.coach" as const;
  readonly description = "Career coaching assistant for WhatsApp/webchat using verified content and free resources.";

  canHandle(message: AgentMessage): boolean {
    const text = message.text.toLowerCase();
    const coachKeywords = [
      "coach", "coaching", "cv", "currículum", "curriculum", "entrevista", "interview",
      "empleo", "trabajo", "job", "skill", "habilidad", "aprender", "curso", "gratis",
      "free", "course", "mejorar", "improve", "carrera", "career", "sueldo", "salario",
      "salary", "negotiation", "negociar", "orientación", "guidance", "ayuda",
    ];
    return coachKeywords.some((kw) => text.includes(kw));
  }

  async run(message: AgentMessage, context: AgentContext): Promise<SkillResult> {
    const isEs = context.locale === "es";

    const systemPrompt = isEs
      ? `Eres el Coach Laboral de BeJoby. Tu misión es ayudar a personas en búsqueda de empleo o en riesgo laboral en Latinoamérica.

Reglas:
- No prometas empleo ni afirmes que conseguirás trabajo por ellos.
- No inventes vacantes, empresas ni estadísticas.
- Responde con tono cálido, práctico y alentador.
- Sugiere material gratuito de aif369.com cuando sea relevante.
- Si la consulta es médica, legal, financiera compleja o de salud mental, deriva amablemente a un profesional humano.
- Mantén respuestas concisas (máximo 3-4 párrafos cortos) para WhatsApp.
- Recomienda siempre recursos gratuitos; las donaciones son voluntarias.`
      : `You are BeJoby's Career Coach. Your mission is to help people looking for work or at risk of job loss in Latin America.

Rules:
- Do not promise employment or claim you will get them a job.
- Do not invent job postings, companies, or statistics.
- Respond with a warm, practical, and encouraging tone.
- Suggest free material from aif369.com when relevant.
- If the query is medical, legal, complex financial, or mental health, gently refer to a human professional.
- Keep responses concise (max 3-4 short paragraphs) for WhatsApp.
- Always recommend free resources; donations are voluntary.`;

    let response: string;
    try {
      const prompt = `${systemPrompt}\n\nUsuario: ${message.text}\n\nCoach:`;
      response = await generateText("COACH", prompt);
    } catch (err) {
      console.error("[CoachSkill] LLM error:", err);
      response = isEs
        ? "Gracias por tu mensaje. Estoy aquí para orientarte, aunque ahora tengo una limitación técnica. Intenta de nuevo en unos minutos o escribe 'humano' para hablar con alguien."
        : "Thank you for your message. I'm here to guide you, although I currently have a technical limitation. Please try again in a few minutes or type 'human' to speak with someone.";
    }

    return {
      response,
      actions: [{ type: "reply", name: "coach_answer", payload: { channel: "whatsapp" } }],
      evidence: [{ source: "bejoby.coach", summary: "Career coaching response via Gemini" }],
    };
  }
}
