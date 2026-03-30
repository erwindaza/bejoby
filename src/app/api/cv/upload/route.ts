// src/app/api/cv/upload/route.ts — Upload CV file to GCS
import { uploadCV } from "@/lib/gcp/storage";
import { success, error, serverError } from "@/lib/utils/api-response";

export const runtime = "nodejs";

// POST /api/cv/upload — Multipart form upload
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("application_id") as string | null;

    if (!file) return error("No se envió ningún archivo");
    if (!applicationId) return error("application_id es requerido");

    // Read file into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadCV(buffer, file.name, file.type, applicationId);

    return success({
      path: result.path,
      size: result.size,
      fileName: file.name,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("no permitido") || err.message.includes("excede"))) {
      return error(err.message);
    }
    console.error("[POST /api/cv/upload]", err);
    return serverError();
  }
}
