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
}) {
  const jobUrl = `https://www.bejoby.com/es/jobs/${application.job_id}`;
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
        <tr><td style="padding:6px 12px;color:#666">ID postulación</td><td style="padding:6px 12px;font-size:12px;color:#999">${application.id}</td></tr>
      </table>
      <p style="margin-top:16px"><a href="${jobUrl}" style="color:#2563eb">Ver oferta →</a></p>
    </div>`,
  );
}
