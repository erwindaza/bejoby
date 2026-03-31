// src/app/api/auth/my-data/route.ts — ARCO-P data rights (Ley 21.719 Chile)
// Provides: Access (download), Portability (JSON export), Cancellation (delete)
import { getSessionUser } from "@/lib/auth";
import { users, applications, candidates, sessions, dataRequests } from "@/lib/gcp/collections";
import { success, error, serverError } from "@/lib/utils/api-response";
import { FieldValue } from "@google-cloud/firestore";

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
    const candidateSnap = await candidates().where("email", "==", user.email).limit(1).get();
    if (!candidateSnap.empty) {
      const cDoc = candidateSnap.docs[0];
      userData.candidate_profile = { id: cDoc.id, ...cDoc.data() };
    }

    // Applications
    const appSnap = await applications().where("candidate_email", "==", user.email).get();
    userData.applications = appSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        job_id: data.job_id,
        status: data.status,
        message: data.message,
        cv_filename: data.cv_filename,
        ai_analysis: data.ai_analysis ? {
          score: data.ai_analysis.score,
          summary: data.ai_analysis.summary,
          strengths: data.ai_analysis.strengths,
          gaps: data.ai_analysis.gaps,
          recommendation: data.ai_analysis.recommendation,
          analyzed_at: data.ai_analysis.analyzed_at,
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

    // Log the deletion request (don't delete immediately — allow 30 day grace period)
    await dataRequests().add({
      user_id: user.id,
      email: user.email,
      type: "deletion",
      status: "pending",
      requested_at: FieldValue.serverTimestamp(),
      scheduled_deletion_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Solicitud de eliminación bajo Ley 21.719. Datos serán eliminados en 30 días salvo objeción.",
    });

    // Invalidate all sessions immediately
    const sessionSnap = await sessions().where("user_id", "==", user.id).get();
    const batch = sessions().firestore.batch();
    sessionSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    return success({
      message: "Solicitud de eliminación recibida. Tus datos serán eliminados en 30 días. Si deseas cancelar esta solicitud, contacta a contacto@bejoby.com.",
      scheduled_deletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error("[DELETE /api/auth/my-data]", err);
    return serverError();
  }
}
