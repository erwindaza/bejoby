// src/app/api/cv/download/route.ts — Generate signed download URL for a CV
import { getSignedCVUrl } from "@/lib/gcp/storage";
import { getSessionUser } from "@/lib/auth";
import { success, error, serverError } from "@/lib/utils/api-response";
import { applications, jobs } from "@/lib/gcp/collections";

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

    if (!user.employer_id) {
      return error("Forbidden", 403);
    }

    const parts = path.split("/");
    const applicationId = parts[1];
    if (!applicationId) {
      return error("Ruta de archivo inválida");
    }

    const appDoc = await applications().doc(applicationId).get();
    if (!appDoc.exists) {
      return error("Application not found", 404);
    }

    const appData = appDoc.data() as Record<string, unknown>;
    if (appData.cv_path !== path) {
      return error("Forbidden", 403);
    }

    const jobDoc = await jobs().doc(String(appData.job_id || "")).get();
    if (!jobDoc.exists || jobDoc.data()?.employer_id !== user.employer_id) {
      return error("Forbidden", 403);
    }

    const url = await getSignedCVUrl(path);
    return success({ url });
  } catch (err) {
    console.error("[GET /api/cv/download]", err);
    return serverError();
  }
}
