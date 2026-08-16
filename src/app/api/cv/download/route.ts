// src/app/api/cv/download/route.ts — Generate signed download URL for a CV
import { getSignedCVUrl } from "@/lib/gcp/storage";
import { getSessionUser } from "@/lib/auth";
import { applications, jobs } from "@/lib/gcp/collections";
import { success, error, serverError } from "@/lib/utils/api-response";

// GET /api/cv/download?path=cvs/xxx/file.pdf
export async function GET(req: Request) {
  try {
    // Only authenticated users can download CVs
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path || !path.startsWith("cvs/")) {
      return error("Ruta de archivo inválida");
    }

    const [, applicationId] = path.split("/");
    if (!applicationId) {
      return error("Ruta de archivo inválida");
    }

    const applicationDoc = await applications().doc(applicationId).get();
    if (!applicationDoc.exists) {
      return error("Postulación no encontrada", 404);
    }

    const application = applicationDoc.data()!;
    if (application.cv_path !== path) {
      return error("No autorizado", 403);
    }

    const isCandidateOwner = application.candidate_email === user.email;
    let isEmployerOwner = false;

    if (user.employer_id && application.job_id) {
      const jobDoc = await jobs().doc(application.job_id).get();
      isEmployerOwner = jobDoc.exists && jobDoc.data()?.employer_id === user.employer_id;
    }

    if (!isCandidateOwner && !isEmployerOwner) {
      return error("No autorizado", 403);
    }

    const url = await getSignedCVUrl(path);
    return success({ url });
  } catch (err) {
    console.error("[GET /api/cv/download]", err);
    return serverError();
  }
}
