import { getSessionUser } from "@/lib/auth";
import { privacyRequests } from "@/lib/gcp/collections";
import {
  createPrivacyRequest,
  completePrivacyRequest,
} from "@/lib/compliance/privacy-requests";
import {
  exportUserData,
  requestUserDeletion,
  rectifyUserField,
  blockProcessingForPurpose,
} from "@/lib/compliance/arco-handler";
import { createPrivacyRequestSchema } from "@/lib/validators/privacy-request";
import { success, created, error, serverError } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    const snapshot = await privacyRequests()
      .where("user_id", "==", user.id)
      .orderBy("received_at", "desc")
      .get();

    return success(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    console.error("[GET /api/privacy/requests]", err);
    return serverError();
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    const body = await req.json().catch(() => null);
    const parsed = createPrivacyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    const { request_type, target, description, requested_blocking, correction_payload } =
      parsed.data;

    // En el MVP, ACCESS/PORTABILITY/SUPPRESSION/RECTIFICATION/OPPOSITION/BLOCKING
    // se ejecutan automáticamente sobre el usuario autenticado.
    // Decisiones automatizadas se registran como solicitud para revisión humana.
    if (["ACCESS", "PORTABILITY"].includes(request_type)) {
      const exportPackage = await exportUserData(user.id);
      const privacyRequest = await createPrivacyRequest({
        user_id: user.id,
        email: user.email,
        request_type,
        target,
        description,
        requested_blocking,
        correction_payload,
      });
      await completePrivacyRequest(
        privacyRequest.request_id,
        `Datos exportados vía portal (export_id=${exportPackage.export_id}).`,
      );
      return created({
        request_id: privacyRequest.request_id,
        status: "COMPLETED",
        export: exportPackage,
      });
    }

    if (request_type === "SUPPRESSION") {
      const deletionResult = await requestUserDeletion(user.id);
      const privacyRequest = await createPrivacyRequest({
        user_id: user.id,
        email: user.email,
        request_type,
        target,
        description,
        requested_blocking,
        correction_payload,
      });

      if (deletionResult.deleted) {
        await completePrivacyRequest(
          privacyRequest.request_id,
          "Cuenta marcada para eliminación (soft-delete). Se eliminará físicamente tras período de gracia.",
        );
        return created({
          request_id: privacyRequest.request_id,
          status: "COMPLETED",
          deletion: deletionResult,
        });
      }

      await completePrivacyRequest(
        privacyRequest.request_id,
        `Solicitud rechazada: ${deletionResult.reasons.join(" ")}`,
      );
      return created({
        request_id: privacyRequest.request_id,
        status: "COMPLETED",
        deletion: deletionResult,
      });
    }

    if (request_type === "RECTIFICATION" && correction_payload) {
      const field = correction_payload.field as string;
      const newValue = correction_payload.new_value;
      if (field && newValue !== undefined) {
        await rectifyUserField(user.id, {
          field,
          new_value: newValue,
          reason: description,
        });
      }
      const privacyRequest = await createPrivacyRequest({
        user_id: user.id,
        email: user.email,
        request_type,
        target,
        description,
        requested_blocking,
        correction_payload,
      });
      await completePrivacyRequest(
        privacyRequest.request_id,
        `Campo ${field} rectificado vía portal.`,
      );
      return created({
        request_id: privacyRequest.request_id,
        status: "COMPLETED",
      });
    }

    if (["OPPOSITION", "BLOCKING"].includes(request_type)) {
      const purposeCode = (target || "marketing_optional") as string;
      await blockProcessingForPurpose(user.id, purposeCode, request_type);
      const privacyRequest = await createPrivacyRequest({
        user_id: user.id,
        email: user.email,
        request_type,
        target,
        description,
        requested_blocking,
        correction_payload,
      });
      await completePrivacyRequest(
        privacyRequest.request_id,
        `Bloqueo aplicado para finalidad ${purposeCode}.`,
      );
      return created({
        request_id: privacyRequest.request_id,
        status: "COMPLETED",
      });
    }

    // Caso por defecto: registrar solicitud para revisión humana
    // (AUTOMATED_DECISION_REVIEW, CONSENT_WITHDRAWAL, etc.).
    const privacyRequest = await createPrivacyRequest({
      user_id: user.id,
      email: user.email,
      request_type,
      target,
      description,
      requested_blocking,
      correction_payload,
    });

    return created(privacyRequest);
  } catch (err) {
    console.error("[POST /api/privacy/requests]", err);
    return serverError();
  }
}
