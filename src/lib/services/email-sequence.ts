// src/lib/services/email-sequence.ts — Email sequence engine for HR cold outreach
import { FieldValue } from "@google-cloud/firestore";
import { emailSequences } from "@/lib/gcp/collections";
import nodemailer from "nodemailer";

const SMTP_HOST = (process.env.SMTP_HOST || "smtp.zoho.com").trim();
const SMTP_PORT = parseInt((process.env.SMTP_PORT || "465").trim(), 10);
const SMTP_USER = (process.env.SMTP_USER || "").trim();
const SMTP_PASS = (process.env.SMTP_PASS || "").trim();
const SMTP_FROM = (process.env.SMTP_FROM || SMTP_USER).trim();

function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export interface EmailSequence {
  id?: string;
  to_email: string;
  to_name: string;
  to_company: string;
  sequence_type: "hr-cold-outreach";
  current_step: number; // 0, 1, 2
  status: "active" | "completed" | "unsubscribed";
  scheduled_next: Date | null;
  steps_sent: { step: number; sent_at: Date }[];
  unsubscribe_token: string;
  created_at?: Date;
  updated_at?: Date;
}

// Cold outreach sequence templates
const SEQUENCES = {
  "hr-cold-outreach": [
    {
      step: 0,
      days: 0, // immediate
      subject: "¿Cuánto tiempo inviertes revisando CVs?",
      body: (name: string, company: string) => `
Hola ${name},

En ${company}, probablemente pasas horas revisando decenas de CVs para cada oferta, ¿verdad?

Mientras tanto, tus mejores candidatos se van con la competencia.

Te escribo porque hemos visto que el problema no es la falta de candidatos, sino el tiempo que inviertes analizándolos.

BeJoby usa IA para pre-evaluar automáticamente cada candidato y entregarte un ranking listo para decidir.

Resultado: contratas 3x más rápido.

¿Te gustaría verlo en acción?

Saludos,
BeJoby Team
      `,
    },
    {
      step: 1,
      days: 3,
      subject: "Así funciona BeJoby: el candidato llega pre-evaluado",
      body: (name: string, company: string) => `
Hola ${name},

Siguiendo nuestro último email para ${company}...

Aquí te muestro cómo la mayoría de clientes nuestros ahorran tiempo:

1️⃣  Publican una oferta en 2 minutos
2️⃣  Nuestra IA analiza cada candidato (score 0-100%, fortalezas, brechas)
3️⃣  Ven un ranking de los mejores candidatos
4️⃣  Seleccionan y contratan

Sin revisar CVs manualmente. Sin spam. Sin intermediarios.

La mayoría de nuestros clientes encuentra al candidato ideal en menos de 7 días.

¿Quieres probar?

Saludos,
BeJoby Team
      `,
    },
    {
      step: 2,
      days: 7,
      subject: "30 días gratis — prueba una oferta sin costo",
      body: (name: string, company: string) => `
Hola ${name},

Última propuesta de parte mía para ${company}: prueba BeJoby sin riesgo.

Te damos 30 días completos para publicar una oferta y ver cómo funciona la IA. Sin tarjeta de crédito. Sin compromiso.

→ Acceso a la plataforma
→ Análisis IA ilimitado
→ Reporte de compatibilidad por candidato

Solo necesitas hacer clic aquí y crear tu cuenta.

Si en 30 días no ves valor, no pasa nada. Pero apuesto a que vas a ahorrar +10 horas de revisión.

Saludos,
BeJoby Team
      `,
    },
  ],
};

export async function createSequence(email: string, name: string, company: string): Promise<EmailSequence> {
  const unsubscribeToken = Math.random().toString(36).slice(2);
  const now = new Date();

  const sequence: EmailSequence = {
    to_email: email,
    to_name: name,
    to_company: company,
    sequence_type: "hr-cold-outreach",
    current_step: 0,
    status: "active",
    scheduled_next: now,
    steps_sent: [],
    unsubscribe_token: unsubscribeToken,
    created_at: now,
    updated_at: now,
  };

  const docRef = emailSequences().doc();
  await docRef.set({
    ...sequence,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  console.log(`[email-sequence] Created sequence for ${email}`);
  return { ...sequence, id: docRef.id };
}

export async function sendStep(
  sequenceId: string,
  sequence: EmailSequence,
  step: number,
): Promise<void> {
  const stepTemplate = SEQUENCES["hr-cold-outreach"][step];
  if (!stepTemplate) throw new Error(`Step ${step} not found`);

  const subject = stepTemplate.subject;
  const body = stepTemplate.body(sequence.to_name, sequence.to_company);
  const unsubscribeLink = `https://www.bejoby.com/api/webhooks/email-unsubscribe?token=${sequence.unsubscribe_token}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="white-space:pre-wrap;color:#333;line-height:1.6">${body.trim()}</div>
      <hr style="margin:20px 0;border:none;border-top:1px solid #ddd">
      <p style="color:#999;font-size:12px">
        <a href="${unsubscribeLink}" style="color:#2563eb;text-decoration:none">Dejar de recibir estos emails</a>
      </p>
    </div>
  `;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"BeJoby" <${SMTP_FROM}>`,
    to: sequence.to_email,
    subject,
    html,
    headers: { "List-Unsubscribe": `<${unsubscribeLink}>` },
  });

  console.log(`[email-sequence] Sent step ${step} to ${sequence.to_email}`);
}

export async function processSequences(): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  const snap = await emailSequences()
    .where("status", "==", "active")
    .where("scheduled_next", "<=", now)
    .limit(50)
    .get();

  let processed = 0,
    errors = 0;

  for (const doc of snap.docs) {
    try {
      const seq = doc.data() as EmailSequence;
      const seqTemplate = SEQUENCES["hr-cold-outreach"];

      if (seq.current_step >= seqTemplate.length) {
        await doc.ref.update({
          status: "completed",
          updated_at: FieldValue.serverTimestamp(),
        });
        continue;
      }

      // Send the current step
      await sendStep(doc.id, seq, seq.current_step);

      // Calculate next step date
      const nextStep = seq.current_step + 1;
      const nextStepTemplate = seqTemplate[nextStep];
      const scheduledNext = nextStepTemplate
        ? new Date(now.getTime() + nextStepTemplate.days * 24 * 60 * 60 * 1000)
        : null;

      const newStepsSent = [...seq.steps_sent, { step: seq.current_step, sent_at: now }];

      await doc.ref.update({
        current_step: nextStep,
        scheduled_next: scheduledNext || null,
        steps_sent: newStepsSent,
        status: nextStep >= seqTemplate.length ? "completed" : "active",
        updated_at: FieldValue.serverTimestamp(),
      });

      processed++;
    } catch (err) {
      console.error(`[email-sequence] Error processing ${doc.id}:`, err);
      errors++;
    }
  }

  console.log(`[email-sequence] Processed ${processed} sequences, ${errors} errors`);
  return { processed, errors };
}

export async function unsubscribe(token: string): Promise<void> {
  const snap = await emailSequences()
    .where("unsubscribe_token", "==", token)
    .limit(1)
    .get();

  if (snap.empty) throw new Error("Token not found");

  await snap.docs[0].ref.update({
    status: "unsubscribed",
    updated_at: FieldValue.serverTimestamp(),
  });

  console.log(`[email-sequence] Unsubscribed ${snap.docs[0].data().to_email}`);
}
