// POST /api/applications/[id]/contact — Candidate sends a message to the employer
import { applications, jobs, employers, interactions } from "@/lib/gcp/collections";
import { getSessionUser } from "@/lib/auth";
import { sendToAddress } from "@/lib/email";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { z } from "zod";

const contactSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user || user.employer_id) return error("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const appDoc = await applications().doc(id).get();
    if (!appDoc.exists) return notFound("Application");

    const appData = appDoc.data() as Record<string, unknown>;
    if (appData.candidate_id !== user.id) {
      return error("Forbidden", 403);
    }

    // Only allow contact on active applications
    const closedStatuses = ["rechazo", "expirada"];
    if (closedStatuses.includes(String(appData.status))) {
      return error("Cannot contact employer on a closed application", 409);
    }

    const jobDoc = await jobs().doc(String(appData.job_id || "")).get();
    if (!jobDoc.exists) return notFound("Job");
    const jobData = jobDoc.data() as Record<string, unknown>;

    const employerDoc = await employers().doc(String(jobData.employer_id || "")).get();
    const employerEmail = employerDoc.exists ? (employerDoc.data()?.email as string) : null;

    // Log the interaction regardless of email delivery outcome
    const interactionRef = await interactions().add({
      application_id: id,
      from_user_id: user.id,
      type: "email",
      subject: `Mensaje sobre postulación a ${jobData.title || "oferta"}`,
      body: parsed.data.message,
      created_at: FieldValue.serverTimestamp(),
      is_public: true,
    });

    let emailSent = false;
    if (employerEmail) {
      emailSent = await sendToAddress(
        employerEmail,
        `Mensaje de candidato — ${jobData.title || "postulación"}`,
        `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#2563eb">Nuevo mensaje de un candidato</h2>
          <p style="color:#666">Oferta: <strong>${jobData.title || "N/A"}</strong></p>
          <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0">
            <p style="color:#1e293b;white-space:pre-wrap">${parsed.data.message}</p>
          </div>
          <p style="color:#999;font-size:12px">ID postulación: ${id}</p>
        </div>`
      );
    }

    return success({
      interactionId: interactionRef.id,
      emailSent,
    });
  } catch (err) {
    console.error("[POST /api/applications/:id/contact]", err);
    return serverError();
  }
}
