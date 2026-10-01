// src/app/api/privacy/consents/route.ts
// Registro de consentimientos para BeJoby (coach laboral, perfil, IA, marketing).

import { getSessionUser } from "@/lib/auth";
import { recordConsent } from "@/lib/compliance/consent";
import { hashForLookup } from "@/lib/security/pii";
import { createConsentSchema } from "@/lib/validators/consent";
import { created, error, serverError } from "@/lib/utils/api-response";

function getClientIP(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    const body = await req.json().catch(() => null);
    const parsed = createConsentSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    const { consent_type, purpose, policy_version, consent_text_snapshot, accepted } =
      parsed.data;

    // Rechazar si no es aceptación explícita
    if (accepted !== true) {
      return error("El consentimiento debe ser aceptado explícitamente.", 400);
    }

    const ip = getClientIP(req);
    const ipHash = ip ? hashForLookup(ip) : null;
    const userAgent = req.headers.get("user-agent") || null;

    const consentId = await recordConsent({
      user_id: user.id,
      email: user.email,
      consent_type,
      purpose,
      policy_version,
      consent_text_snapshot,
      source: "web",
      ip_hash: ipHash,
      user_agent: userAgent,
    });

    return created({
      consent_id: consentId,
      status: "GRANTED",
    });
  } catch (err) {
    console.error("[POST /api/privacy/consents]", err);
    return serverError();
  }
}
