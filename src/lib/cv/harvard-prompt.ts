// src/lib/cv/harvard-prompt.ts
// Prompt template for converting any CV text to Harvard format using Gemini

export function buildHarvardPrompt(cvText: string, lang: "es" | "en"): string {
  const instructions =
    lang === "es"
      ? `Eres un experto en redacción de currículums profesionales. Tu tarea es tomar el siguiente texto de CV y reestructurarlo en formato Harvard.

Reglas del formato Harvard:
1. DATOS DE CONTACTO: Nombre completo centrado, seguido de dirección, teléfono, email y LinkedIn.
2. RESUMEN PROFESIONAL: 2-3 líneas que resuman la propuesta de valor del candidato.
3. EDUCACIÓN: Institución, título, fechas. Orden cronológico inverso.
4. EXPERIENCIA PROFESIONAL: Empresa, cargo, fechas, logros con viñetas. Usa verbos de acción y cuantifica resultados. Orden cronológico inverso.
5. HABILIDADES: Lista de competencias técnicas y blandas relevantes.
6. ACTIVIDADES Y LOGROS: Certificaciones, voluntariado, premios.

Instrucciones:
- Mantén toda la información proporcionada, no inventes datos.
- Mejora la redacción y elimina errores ortográficos.
- Cuantifica logros cuando sea posible.
- Usa verbos de acción: lideré, implementé, desarrollé, optimicé, etc.
- Formatea de manera limpia y profesional.
- Responde SOLO con el CV formateado, sin explicaciones adicionales.`
      : `You are an expert professional resume writer. Your task is to take the following CV text and restructure it into Harvard format.

Harvard Format Rules:
1. CONTACT INFORMATION: Full name centered, followed by address, phone, email, and LinkedIn.
2. PROFESSIONAL SUMMARY: 2-3 lines summarizing the candidate's value proposition.
3. EDUCATION: Institution, degree, dates. Reverse chronological order.
4. PROFESSIONAL EXPERIENCE: Company, title, dates, achievements with bullet points. Use action verbs and quantify results. Reverse chronological order.
5. SKILLS: List of relevant technical and soft skills.
6. ACTIVITIES AND ACHIEVEMENTS: Certifications, volunteering, awards.

Instructions:
- Keep all provided information, do not invent data.
- Improve wording and fix spelling errors.
- Quantify achievements when possible.
- Use action verbs: led, implemented, developed, optimized, etc.
- Format cleanly and professionally.
- Respond ONLY with the formatted CV, no additional explanations.`;

  return `${instructions}\n\n--- CV ORIGINAL ---\n${cvText}\n--- FIN ---`;
}
