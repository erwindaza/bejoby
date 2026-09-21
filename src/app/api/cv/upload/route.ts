// src/app/api/cv/upload/route.ts — Upload CV file to GCS
import { uploadCV } from "@/lib/gcp/storage";
import { success, error, serverError } from "@/lib/utils/api-response";
import { applications, jobs } from "@/lib/gcp/collections";
import { verifyUploadToken } from "@/lib/security/upload-token";
import { FieldValue, Timestamp } from "@google-cloud/firestore";
import { analyzeApplication } from "@/lib/ai/match-analysis";
import { decryptApplicationPII } from "@/lib/security/pii";
import { sendAnalysisReport } from "@/lib/email";

export const runtime = "nodejs";

// POST /api/cv/upload — Multipart form upload
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("application_id") as string | null;
    const uploadToken = formData.get("upload_token") as string | null;

    if (!file) return error("No se envió ningún archivo");
    if (!applicationId) return error("application_id es requerido");
    if (!uploadToken) return error("upload_token es requerido", 401);

    const applicationRef = applications().doc(applicationId);
    const applicationDoc = await applicationRef.get();
    if (!applicationDoc.exists) return error("Postulación no encontrada", 404);

    const application = applicationDoc.data()!;
    const tokenHash = String(application.cv_upload_token_hash || "");
    const expiresAt = application.cv_upload_token_expires_at;
    const expirationMs = expiresAt instanceof Timestamp
      ? expiresAt.toMillis()
      : new Date(expiresAt || 0).getTime();
    if (!tokenHash || expirationMs <= Date.now() || !verifyUploadToken(uploadToken, tokenHash)) {
      return error("Token de carga inválido o expirado", 403);
    }
    if (application.cv_path) return error("La postulación ya tiene un CV adjunto", 409);

    // Read file into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadCV(buffer, file.name, file.type, applicationId);

    await applicationRef.update({
      cv_path: result.path,
      cv_filename: file.name.slice(0, 300),
      cv_upload_token_hash: FieldValue.delete(),
      cv_upload_token_expires_at: FieldValue.delete(),
      updated_at: FieldValue.serverTimestamp(),
    });

    void (async () => {
      try {
        const analysis = await analyzeApplication(applicationId);
        if (!analysis) return;
        const updatedDoc = await applicationRef.get();
        const appData = updatedDoc.data();
        if (!appData) return;
        const decrypted = decryptApplicationPII(appData as Record<string, unknown>);
        const jobDoc = await jobs().doc(String(appData.job_id)).get();
        await sendAnalysisReport({
          candidate_name: String(decrypted.candidate_name || ""),
          candidate_email: String(decrypted.candidate_email || ""),
          job_title: jobDoc.exists ? String(jobDoc.data()?.title || appData.job_id) : String(appData.job_id),
          job_id: String(appData.job_id),
          cv_filename: String(appData.cv_filename || ""),
          analysis,
        });
      } catch (analysisError) {
        console.error("[CV upload analysis]", analysisError);
      }
    })();

    return success({
      path: result.path,
      size: result.size,
      fileName: file.name,
      encrypted_at_rest: true,
      transport: "TLS",
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("no permitido") || err.message.includes("excede") || err.message.includes("no coincide"))) {
      return error(err.message);
    }
    console.error("[POST /api/cv/upload]", err);
    return serverError();
  }
}
