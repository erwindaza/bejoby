// src/app/api/cv/download/route.ts — Generate signed download URL for a CV
import { getSignedCVUrl } from "@/lib/gcp/storage";
import { getSessionUser } from "@/lib/auth";
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

    const url = await getSignedCVUrl(path);
    return success({ url });
  } catch (err) {
    console.error("[GET /api/cv/download]", err);
    return serverError();
  }
}
