// src/app/api/auth/my-data/route.ts — ARCO-P data rights (Ley 21.719 Chile)
// Provides: Access (download), Portability (JSON export), Cancellation (delete)
import { getSessionUser } from "@/lib/auth";
import { users, applications, candidates, sessions } from "@/lib/gcp/collections";
import { success, error, serverError } from "@/lib/utils/api-response";
import { createPrivacyRequest } from "@/lib/compliance/privacy-requests";
import { logAuditEvent } from "@/lib/compliance/audit";
import { decryptApplicationPII, decryptCandidatePII, hashForLookup } from "@/lib/security/pii";

// GET /api/auth/my-data — Access & Portability: export all user data as JSON
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    // Gather all user data
    const userData: Record<string, unknown> = { user_id: user.id, email: user.email };

    // User profile
    const userDoc = await users().doc(user.id).get();
    if (userDoc.exists) {
      const d = userDoc.data()!;
      userData.profile = { email: d.email, employer_id: d.employer_id, created_at: d.created_at };
    }

    // Find candidate record by email
    const candidateHash = hashForLookup(user.email);
    const [candidateByHash, candidateLegacy] = await Promise.all([
      candidates().where("email_hash", "==", candidateHash).limit(1).get(),
      candidates().where("email", "==", user.email).limit(1).get(),
    ]);
    const candidateSnap = !candidateByHash.empty ? candidateByHash : candidateLegacy;
    if (!candidateSnap.empty) {
      const cDoc = candidateSnap.docs[0];
      userData.candidate_profile = { id: cDoc.id, ...decryptCandidatePII(cDoc.data() as Record<string, unknown>) };
    }

    // Applications
    const [appByHash, appLegacy] = await Promise.all([
      applications().where("candidate_email_hash", "==", candidateHash).get(),
      applications().where("candidate_email", "==", user.email).get(),
    ]);
    const appDocs = !appByHash.empty ? appByHash.docs : appLegacy.docs;
    userData.applications = appDocs.map((d) => {
      const data = decryptApplicationPII(d.data() as Record<string, unknown>) as Record<string, unknown>;
      const aiAnalysis = typeof data.ai_analysis === "object" && data.ai_analysis
        ? data.ai_analysis as Record<string, unknown>
        : null;
      return {
        id: d.id,
        job_id: data.job_id,
        status: data.status,
        message: data.message,
        cv_filename: data.cv_filename,
        ai_analysis: aiAnalysis ? {
          score: aiAnalysis.score,
          summary: aiAnalysis.summary,
          strengths: aiAnalysis.strengths,
          gaps: aiAnalysis.gaps,
          recommendation: aiAnalysis.recommendation,
          analyzed_at: aiAnalysis.analyzed_at,
        } : null,
        created_at: data.created_at,
      };
    });

    userData.exported_at = new Date().toISOString();
    userData.data_rights_notice = {
      law: "Ley 21.719 — Protección de Datos Personales (Chile)",
      rights: [
        "Acceso: Este archivo contiene todos tus datos almacenados",
        "Rectificación: Puedes actualizar tu perfil en cualquier momento",
        "Cancelación: Puedes solicitar la eliminación de tu cuenta vía DELETE /api/auth/my-data",
        "Oposición: Puedes oponerte al tratamiento automatizado contactando a contacto@bejoby.com",
        "Portabilidad: Este JSON es tu exportación portable",
      ],
    };

    await logAuditEvent({
      type: "DATA_EXPORT",
      actor_id: user.id,
      actor_email: user.email,
      subject_id: user.id,
      subject_type: "user",
      purpose: "data_subject_access_portability",
      metadata: {
        included_sections: Object.keys(userData),
      },
    });

    return success(userData);
  } catch (err) {
    console.error("[GET /api/auth/my-data]", err);
    return serverError();
  }
}

// DELETE /api/auth/my-data — Cancellation: request account and data deletion
export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    // Log the suppression request without immediate irreversible deletion.
    const privacyRequest = await createPrivacyRequest({
      user_id: user.id,
      email: user.email,
      request_type: "SUPPRESSION",
      target: "account",
      description: "Solicitud de eliminación de cuenta y datos elegibles bajo Ley 21.719.",
      requested_blocking: true,
    });

    // Invalidate all sessions immediately
    const sessionSnap = await sessions().where("user_id", "==", user.id).get();
    const batch = sessions().firestore.batch();
    sessionSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return success({
      request_id: privacyRequest.request_id,
      status: privacyRequest.status,
      message: "Solicitud de eliminación recibida. Tus datos serán eliminados en 30 días. Si deseas cancelar esta solicitud, contacta a contacto@bejoby.com.",
      scheduled_deletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error("[DELETE /api/auth/my-data]", err);
    return serverError();
  }
}
