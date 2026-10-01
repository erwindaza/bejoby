// src/lib/compliance/retention.ts
// Políticas de retención mínimas viables para BeJoby (coach laboral).
// Vigencia Ley 21.719 Chile: 2026-12-01.

export type RetentionCategory =
  | "active_candidate"
  | "inactive_candidate"
  | "closed_application_unsuccessful"
  | "closed_application_successful"
  | "audit_and_consent"
  | "arco_requests"
  | "soft_delete_buffer";

export interface RetentionRule {
  category: RetentionCategory;
  days: number;
  description: string;
  action: "delete" | "anonymize" | "keep";
}

// Defaults técnicos propuestos; deben ser validados por área legal.
export const RETENTION_RULES: Record<RetentionCategory, RetentionRule> = {
  active_candidate: {
    category: "active_candidate",
    days: 365,
    description: "Candidato con actividad reciente (login o postulación).",
    action: "keep",
  },
  inactive_candidate: {
    category: "inactive_candidate",
    days: 365,
    description: "Candidato sin actividad en el último año.",
    action: "delete",
  },
  closed_application_unsuccessful: {
    category: "closed_application_unsuccessful",
    days: 730,
    description: "Postulación concluida sin contratación.",
    action: "delete",
  },
  closed_application_successful: {
    category: "closed_application_successful",
    days: 3650, // 10 años — solo si aplica
    description: "Postulación exitosa (relación laboral).",
    action: "keep",
  },
  audit_and_consent: {
    category: "audit_and_consent",
    days: 1825, // 5 años
    description: "Evidencia de consentimiento y auditoría.",
    action: "keep",
  },
  arco_requests: {
    category: "arco_requests",
    days: 1825, // 5 años
    description: "Solicitudes ARCO y su resolución.",
    action: "keep",
  },
  soft_delete_buffer: {
    category: "soft_delete_buffer",
    days: 30,
    description: "Período de gracia antes de borrado físico.",
    action: "delete",
  },
};

export function getRetentionRule(category: RetentionCategory): RetentionRule {
  return RETENTION_RULES[category];
}

export function isEligibleForDeletion(
  lastActivityAt: Date,
  category: RetentionCategory,
): boolean {
  const rule = RETENTION_RULES[category];
  if (rule.action === "keep") return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rule.days);
  return lastActivityAt < cutoff;
}

export function calculateRetentionDate(category: RetentionCategory, fromDate?: Date): Date {
  const rule = RETENTION_RULES[category];
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + rule.days);
  return base;
}

/**
 * Determina si un candidato puede ser eliminado hoy.
 * No elimina si tiene postulaciones en curso o reclamos pendientes.
 */
export function canDeleteCandidate(
  lastActivityAt: Date,
  hasActiveApplications: boolean,
  hasPendingPrivacyRequests: boolean,
  hasOpenLegalObligations: boolean,
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (hasActiveApplications) reasons.push("Tiene postulaciones activas en curso.");
  if (hasPendingPrivacyRequests) reasons.push("Tiene solicitudes ARCO pendientes.");
  if (hasOpenLegalObligations) reasons.push("Existen obligaciones legales de conservación.");

  const inactiveRule = RETENTION_RULES.inactive_candidate;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - inactiveRule.days);

  if (lastActivityAt >= cutoff) {
    reasons.push(`Cuenta aún dentro del período de retención de ${inactiveRule.days} días.`);
  }

  return { eligible: reasons.length === 0, reasons };
}
