// POST /api/employer/applications/[id]/feedback — Employer adds private feedback / status change
import { applications, jobs, interactions } from "@/lib/gcp/collections";
import { getSessionUser } from "@/lib/auth";
import { success, error, notFound, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";
import { z } from "zod";

const feedbackSchema = z.object({
  feedback: z.string().max(2000).optional(),
  status: z
    .enum(["enviada", "revisada", "entrevista", "rechazo", "oferta", "aceptada", "expirada"])
    .optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user || !user.employer_id) return error("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }
    if (!parsed.data.feedback && !parsed.data.status) {
      return error("Provide feedback or status");
    }

    const appDoc = await applications().doc(id).get();
    if (!appDoc.exists) return notFound("Application");

    const appData = appDoc.data() as Record<string, unknown>;
    const jobDoc = await jobs().doc(String(appData.job_id || "")).get();
    if (!jobDoc.exists) return notFound("Job");
    const jobData = jobDoc.data() as Record<string, unknown>;
    if (jobData.employer_id !== user.employer_id) {
      return error("Forbidden", 403);
    }

    const updates: Record<string, unknown> = {
      updated_at: FieldValue.serverTimestamp(),
    };

    if (parsed.data.feedback !== undefined) {
      updates.feedback = parsed.data.feedback;
    }

    if (parsed.data.status) {
      updates.status = parsed.data.status;
      updates.status_history = FieldValue.arrayUnion({
        status: parsed.data.status,
        timestamp: new Date(),
        ...(parsed.data.feedback && { note: parsed.data.feedback }),
      });
    }

    await applications().doc(id).update(updates);

    // Log as a private interaction (not visible to candidate unless it's a status change)
    if (parsed.data.feedback) {
      await interactions().add({
        application_id: id,
        from_user_id: user.id,
        type: "internal_note",
        body: parsed.data.feedback,
        created_at: FieldValue.serverTimestamp(),
        is_public: false,
      });
    }

    if (parsed.data.status) {
      await interactions().add({
        application_id: id,
        from_user_id: user.id,
        type: "status_change",
        body: `Estado actualizado a: ${parsed.data.status}`,
        created_at: FieldValue.serverTimestamp(),
        is_public: true,
      });
    }

    return success({ id, ...parsed.data });
  } catch (err) {
    console.error("[POST /api/employer/applications/:id/feedback]", err);
    return serverError();
  }
}
