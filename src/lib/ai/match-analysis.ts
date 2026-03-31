// src/lib/ai/match-analysis.ts — AI-powered candidate-job fit analysis using Gemini
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Storage } from "@google-cloud/storage";
import { parseServiceAccountKey } from "@/lib/gcp/firestore";
import { applications, jobs, aiAuditLog } from "@/lib/gcp/collections";
import { anonymizeForLLM } from "@/lib/ai/anonymize";
import { FieldValue } from "@google-cloud/firestore";
import mammoth from "mammoth";

const CV_BUCKET = process.env.GCS_CV_BUCKET || "bejoby-cvs";

export interface MatchAnalysis {
  score: number; // 0-100
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  analyzed_at: string;
}

/**
 * Extract text from a CV file stored in GCS.
 */
async function extractCVText(cvPath: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  const keyRaw = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (!projectId || !keyRaw) throw new Error("Missing GCP credentials");

  const credentials = parseServiceAccountKey(keyRaw);
  const privateKey = (credentials.private_key || "").replace(/\\n/g, "\n");

  const storage = new Storage({
    projectId,
    credentials: { client_email: credentials.client_email, private_key: privateKey },
  });

  const [buffer] = await storage.bucket(CV_BUCKET).file(cvPath).download();

  if (cvPath.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  }

  if (cvPath.endsWith(".docx") || cvPath.endsWith(".doc")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return "(No se pudo extraer texto del archivo)";
}

/**
 * Run Gemini analysis comparing CV text against job description.
 */
async function analyzeWithGemini(
  cvText: string,
  jobTitle: string,
  jobDescription: string,
  candidateMessage: string,
): Promise<MatchAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Eres un experto reclutador senior con 20 años de experiencia en selección de personal.

Analiza qué tanto calza este candidato con la oferta laboral. Sé honesto y directo.
IMPORTANTE: Basa tu análisis SOLO en habilidades, experiencia profesional y competencias técnicas. NUNCA consideres género, edad, nacionalidad, estado civil, religión u otros datos personales sensibles.

## OFERTA LABORAL
**Cargo:** ${jobTitle}
**Descripción:**
${jobDescription}

## CANDIDATO (datos anonimizados)

### CV del candidato:
${anonymizeForLLM(cvText.slice(0, 8000))}

${candidateMessage ? `### Mensaje del candidato:\n${anonymizeForLLM(candidateMessage)}` : ""}

## INSTRUCCIONES
Responde SOLO en formato JSON válido (sin markdown, sin \`\`\`):
{
  "score": <número del 0 al 100 representando el % de calce>,
  "summary": "<resumen ejecutivo de 2-3 líneas sobre el candidato>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", ...],
  "gaps": ["<brecha o falencia 1>", "<brecha 2>", ...],
  "recommendation": "<recomendación concreta: contactar de inmediato / entrevistar / descartar / etc>"
}

IMPORTANTE:
- Sé objetivo y profesional
- Si el CV no tiene relación con el cargo, da un score bajo
- Si el candidato calza perfectamente, da un score alto
- Máximo 5 fortalezas y 5 brechas
- Todo en español`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Parse JSON from response (handle possible markdown wrapping)
  const jsonStr = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(jsonStr);

  return {
    score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
    summary: parsed.summary || "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 5) : [],
    recommendation: parsed.recommendation || "",
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Run full analysis pipeline for an application.
 * Fire-and-forget — never throws, logs errors.
 */
export async function analyzeApplication(applicationId: string): Promise<MatchAnalysis | null> {
  try {
    // Fetch application
    const appDoc = await applications().doc(applicationId).get();
    if (!appDoc.exists) {
      console.error(`[AI] Application ${applicationId} not found`);
      return null;
    }
    const appData = appDoc.data()!;

    if (!appData.cv_path) {
      console.log(`[AI] No CV attached to application ${applicationId}, skipping analysis`);
      return null;
    }

    // Fetch job
    const jobDoc = await jobs().doc(appData.job_id).get();
    if (!jobDoc.exists) {
      console.error(`[AI] Job ${appData.job_id} not found`);
      return null;
    }
    const jobData = jobDoc.data()!;

    // Extract CV text
    console.log(`[AI] Extracting text from ${appData.cv_path}...`);
    const cvText = await extractCVText(appData.cv_path);

    if (!cvText || cvText.length < 50) {
      console.warn(`[AI] CV text too short (${cvText.length} chars), skipping analysis`);
      return null;
    }

    // Run Gemini analysis
    console.log(`[AI] Running Gemini analysis for ${appData.candidate_name}...`);
    const analysis = await analyzeWithGemini(
      cvText,
      jobData.title,
      jobData.description,
      appData.message || "",
    );

    // Save analysis to application document
    await applications().doc(applicationId).update({
      ai_analysis: analysis,
    });

    // Audit log: immutable record of AI decision (Ley 21.719 compliance)
    await aiAuditLog().add({
      type: "match_analysis",
      application_id: applicationId,
      job_id: appData.job_id,
      model: "gemini-1.5-flash",
      model_version: "1.5",
      input_summary: {
        cv_length: cvText.length,
        job_title: jobData.title,
        had_message: !!appData.message,
        pii_anonymized: true,
      },
      output: {
        score: analysis.score,
        strengths_count: analysis.strengths.length,
        gaps_count: analysis.gaps.length,
        recommendation: analysis.recommendation,
      },
      human_reviewed: false,
      created_at: FieldValue.serverTimestamp(),
    });

    console.log(`[AI] Analysis complete for ${appData.candidate_name}: score=${analysis.score}/100`);
    return analysis;
  } catch (err) {
    console.error("[AI] Analysis failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
