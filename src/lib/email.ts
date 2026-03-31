// src/lib/email.ts — Email notification utility
import nodemailer from "nodemailer";

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

function isConfigured(): boolean {
  return !!(NOTIFY_EMAIL && SMTP_USER && SMTP_PASS);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Send a notification email. Never throws — failures are logged silently.
 */
async function send(subject: string, html: string): Promise<void> {
  if (!isConfigured()) {
    console.warn("[email] SMTP not configured — skipping notification");
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"BeJoby" <${SMTP_USER}>`,
      to: NOTIFY_EMAIL,
      subject,
      html,
    });
    console.log(`[email] Sent: ${subject}`);
  } catch (err) {
    console.error("[email] Failed to send:", err instanceof Error ? err.message : err);
  }
}

/**
 * Send OTP verification code. Throws on failure (caller should handle).
 * If SMTP not configured, logs the code to console for dev testing.
 */
export async function sendOTP(email: string, code: string): Promise<void> {
  if (!isConfigured()) {
    console.warn(`[email] SMTP not configured — OTP for ${email}: ${code}`);
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"BeJoby" <${SMTP_USER}>`,
      to: email,
      subject: `${code} es tu código de acceso a BeJoby`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
          <h2 style="color:#2563eb;text-align:center">BeJoby</h2>
          <p style="text-align:center;color:#333;font-size:16px">Tu código de verificación es:</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1e293b">${code}</span>
          </div>
          <p style="text-align:center;color:#666;font-size:14px">Este código expira en 10 minutos.</p>
          <p style="text-align:center;color:#999;font-size:12px;margin-top:24px">Si no solicitaste este código, puedes ignorar este email.</p>
        </div>`,
    });
    console.log(`[email] OTP sent to ${email}`);
  } catch (err) {
    console.error("[email] Failed to send OTP:", err instanceof Error ? err.message : err);
    throw new Error("Failed to send verification code");
  }
}

// ─── Specific notification helpers ───────────────────────────────────────

export async function notifyJobPosted(job: {
  id: string;
  title: string;
  location?: string;
  employment_type?: string;
  work_mode?: string;
  employer_id?: string;
}) {
  const url = `https://www.bejoby.com/es/jobs/${job.id}`;
  await send(
    `🟢 Nueva oferta publicada: ${job.title}`,
    `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#2563eb">Nueva oferta en BeJoby</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;color:#666">Cargo</td><td style="padding:6px 12px;font-weight:bold">${job.title}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">Ubicación</td><td style="padding:6px 12px">${job.location || "No especificada"}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">Tipo</td><td style="padding:6px 12px">${job.employment_type || "-"}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">Modalidad</td><td style="padding:6px 12px">${job.work_mode || "-"}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">ID</td><td style="padding:6px 12px;font-size:12px;color:#999">${job.id}</td></tr>
      </table>
      <p style="margin-top:16px"><a href="${url}" style="color:#2563eb">Ver oferta →</a></p>
    </div>`,
  );
}

export async function notifyApplicationReceived(application: {
  id: string;
  job_id: string;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
  message?: string;
  cv_filename?: string;
}) {
  const jobUrl = `https://www.bejoby.com/es/jobs/${application.job_id}`;
  const cvRow = application.cv_filename
    ? `<tr><td style="padding:6px 12px;color:#666">CV adjunto</td><td style="padding:6px 12px">📎 ${application.cv_filename}</td></tr>`
    : "";
  await send(
    `📨 Nueva postulación: ${application.candidate_name} → ${application.job_title}`,
    `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#2563eb">Nueva postulación en BeJoby</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 12px;color:#666">Candidato</td><td style="padding:6px 12px;font-weight:bold">${application.candidate_name}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px"><a href="mailto:${application.candidate_email}">${application.candidate_email}</a></td></tr>
        <tr><td style="padding:6px 12px;color:#666">Oferta</td><td style="padding:6px 12px">${application.job_title}</td></tr>
        ${application.message ? `<tr><td style="padding:6px 12px;color:#666">Mensaje</td><td style="padding:6px 12px">${application.message}</td></tr>` : ""}
        ${cvRow}
        <tr><td style="padding:6px 12px;color:#666">ID postulación</td><td style="padding:6px 12px;font-size:12px;color:#999">${application.id}</td></tr>
      </table>
      <p style="margin-top:16px"><a href="${jobUrl}" style="color:#2563eb">Ver oferta →</a></p>
    </div>`,
  );
}

export async function sendAnalysisReport(data: {
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  job_id: string;
  cv_filename: string;
  analysis: {
    score: number;
    summary: string;
    strengths: string[];
    gaps: string[];
    recommendation: string;
  };
}) {
  const { analysis } = data;
  const jobUrl = `https://www.bejoby.com/es/jobs/${data.job_id}`;

  // Color based on score
  const scoreColor =
    analysis.score >= 70 ? "#16a34a" : analysis.score >= 40 ? "#d97706" : "#dc2626";
  const scoreBg =
    analysis.score >= 70 ? "#dcfce7" : analysis.score >= 40 ? "#fef3c7" : "#fee2e2";
  const scoreEmoji =
    analysis.score >= 70 ? "🟢" : analysis.score >= 40 ? "🟡" : "🔴";

  const strengthsHtml = analysis.strengths
    .map((s) => `<li style="margin-bottom:4px;color:#16a34a">✅ ${s}</li>`)
    .join("");
  const gapsHtml = analysis.gaps
    .map((g) => `<li style="margin-bottom:4px;color:#dc2626">⚠️ ${g}</li>`)
    .join("");

  await send(
    `${scoreEmoji} Análisis IA: ${data.candidate_name} → ${analysis.score}% calce`,
    `
    <div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#2563eb">🤖 Análisis IA — BeJoby</h2>

      <!-- Score badge -->
      <div style="text-align:center;margin:20px 0">
        <div style="display:inline-block;background:${scoreBg};border-radius:16px;padding:16px 32px">
          <span style="font-size:48px;font-weight:bold;color:${scoreColor}">${analysis.score}%</span>
          <br/>
          <span style="font-size:14px;color:#666">compatibilidad candidato-cargo</span>
        </div>
      </div>

      <!-- Candidate info -->
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
        <tr><td style="padding:6px 12px;color:#666">Candidato</td><td style="padding:6px 12px;font-weight:bold">${data.candidate_name}</td></tr>
        <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px"><a href="mailto:${data.candidate_email}">${data.candidate_email}</a></td></tr>
        <tr><td style="padding:6px 12px;color:#666">Oferta</td><td style="padding:6px 12px"><a href="${jobUrl}">${data.job_title}</a></td></tr>
        ${data.cv_filename ? `<tr><td style="padding:6px 12px;color:#666">CV</td><td style="padding:6px 12px">📎 ${data.cv_filename}</td></tr>` : ""}
      </table>

      <!-- Summary -->
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:16px">
        <strong style="color:#1e293b">Resumen ejecutivo:</strong>
        <p style="color:#475569;margin:8px 0 0">${analysis.summary}</p>
      </div>

      <!-- Strengths -->
      ${strengthsHtml ? `
      <div style="margin-bottom:12px">
        <strong style="color:#16a34a">Fortalezas:</strong>
        <ul style="padding-left:20px;margin:8px 0">${strengthsHtml}</ul>
      </div>` : ""}

      <!-- Gaps -->
      ${gapsHtml ? `
      <div style="margin-bottom:12px">
        <strong style="color:#dc2626">Brechas:</strong>
        <ul style="padding-left:20px;margin:8px 0">${gapsHtml}</ul>
      </div>` : ""}

      <!-- Recommendation -->
      <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:16px">
        <strong style="color:#2563eb">📋 Recomendación:</strong>
        <p style="color:#1e40af;margin:8px 0 0">${analysis.recommendation}</p>
      </div>

      <p style="margin-top:24px;color:#999;font-size:12px;text-align:center">
        ⚖️ Análisis generado automáticamente por IA (Gemini). Este informe es orientativo y NO constituye una decisión de contratación.
        De acuerdo con la Ley 21.719 (Chile), el candidato tiene derecho a solicitar una revisión humana de cualquier decisión basada en tratamiento automatizado.
        El análisis fue realizado con datos anonimizados. Use este informe como apoyo complementario, no como criterio único de selección.
      </p>
    </div>`,
  );
}
