// src/lib/compliance/data-classification.ts
// Catálogo de clasificación de datos y políticas de tratamiento para BeJoby.
// Compatible con Ley 19.628 y Ley 21.719 de Chile.

export type DataSensitivityLevel =
  | "CRITICAL"
  | "SENSITIVE"
  | "INTERNAL"
  | "PUBLIC"
  | "SECRET";

export interface DataClassificationPolicy {
  level: DataSensitivityLevel;
  label: string;
  description: string;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  maskingRequired: boolean;
  aiAllowed: "denied" | "anonymized_only" | "approved_workflow" | "approved";
  retentionCategory: RetentionCategory;
}

export type RetentionCategory =
  | "active_candidate"
  | "inactive_candidate"
  | "closed_application_unsuccessful"
  | "closed_application_successful"
  | "audit_and_consent"
  | "arco_requests"
  | "soft_delete_buffer"
  | "public_content";

export const DATA_CLASSIFICATION: Record<DataSensitivityLevel, DataClassificationPolicy> = {
  CRITICAL: {
    level: "CRITICAL",
    label: "Crítico",
    description: "Datos que, de filtrarse, causarían daño grave al titular.",
    encryptionAtRest: true,
    encryptionInTransit: true,
    maskingRequired: true,
    aiAllowed: "denied",
    retentionCategory: "soft_delete_buffer",
  },
  SENSITIVE: {
    level: "SENSITIVE",
    label: "Sensible",
    description: "Datos personales identificables directamente.",
    encryptionAtRest: true,
    encryptionInTransit: true,
    maskingRequired: true,
    aiAllowed: "anonymized_only",
    retentionCategory: "active_candidate",
  },
  INTERNAL: {
    level: "INTERNAL",
    label: "Interno",
    description: "Datos operacionales no directamente identificables.",
    encryptionAtRest: false,
    encryptionInTransit: true,
    maskingRequired: false,
    aiAllowed: "approved_workflow",
    retentionCategory: "audit_and_consent",
  },
  PUBLIC: {
    level: "PUBLIC",
    label: "Público",
    description: "Información pública por naturaleza.",
    encryptionAtRest: false,
    encryptionInTransit: true,
    maskingRequired: false,
    aiAllowed: "approved",
    retentionCategory: "public_content",
  },
  SECRET: {
    level: "SECRET",
    label: "Secreto",
    description: "Claves, tokens y credenciales de servicio.",
    encryptionAtRest: true,
    encryptionInTransit: true,
    maskingRequired: true,
    aiAllowed: "denied",
    retentionCategory: "soft_delete_buffer",
  },
};

export interface DataAsset {
  name: string;
  collectionOrStorage: string;
  fieldPath?: string;
  level: DataSensitivityLevel;
  encryptionKeyEnv?: string;
  legalBases: string[];
  examples: string[];
}

export const DATA_ASSETS: DataAsset[] = [
  {
    name: "Perfil usuario PII",
    collectionOrStorage: "users",
    fieldPath: "pii.*",
    level: "SENSITIVE",
    encryptionKeyEnv: "FIELD_ENCRYPTION_KEY",
    legalBases: ["consent"],
    examples: ["nombre", "email"],
  },
  {
    name: "Hash de búsqueda email",
    collectionOrStorage: "users",
    fieldPath: "email_hash",
    level: "INTERNAL",
    encryptionKeyEnv: "FIELD_HASH_KEY",
    legalBases: ["consent", "legitimate_interest"],
    examples: ["HMAC-SHA256 de email"],
  },
  {
    name: "Preferencias de mejora",
    collectionOrStorage: "users",
    fieldPath: "preferences.*",
    level: "INTERNAL",
    legalBases: ["consent"],
    examples: ["stacks objetivo", "metas de aprendizaje"],
  },
  {
    name: "Consentimientos",
    collectionOrStorage: "consent_records",
    level: "SENSITIVE",
    legalBases: ["legal_obligation"],
    examples: ["snapshot de texto aceptado", "timestamp", "IP hasheada"],
  },
  {
    name: "Solicitudes ARCO",
    collectionOrStorage: "privacy_requests",
    level: "SENSITIVE",
    legalBases: ["legal_obligation"],
    examples: ["tipo de solicitud", "estado", "payload de corrección"],
  },
  {
    name: "Logs de auditoría",
    collectionOrStorage: "audit_events",
    level: "INTERNAL",
    legalBases: ["legal_obligation"],
    examples: ["tipo de evento", "actor", "metadata sin PII"],
  },
  {
    name: "Sesiones y tokens",
    collectionOrStorage: "sessions",
    level: "SECRET",
    legalBases: ["contract"],
    examples: ["token de sesión"],
  },
  {
    name: "Claves de encriptación",
    collectionOrStorage: "Vercel Secrets / Secret Manager",
    level: "SECRET",
    legalBases: ["contract"],
    examples: ["FIELD_ENCRYPTION_KEY", "FIELD_HASH_KEY"],
  },
];

export function getPolicyForLevel(level: DataSensitivityLevel): DataClassificationPolicy {
  return DATA_CLASSIFICATION[level];
}

export function getAssetsForCollection(collection: string): DataAsset[] {
  return DATA_ASSETS.filter((a) => a.collectionOrStorage === collection);
}

export function isAIAllowed(level: DataSensitivityLevel, anonymized = false): boolean {
  const policy = DATA_CLASSIFICATION[level];
  if (policy.aiAllowed === "denied") return false;
  if (policy.aiAllowed === "anonymized_only") return anonymized;
  if (policy.aiAllowed === "approved_workflow") return true; // validar workflow externamente
  return true;
}

export function requiresEncryptionAtRest(level: DataSensitivityLevel): boolean {
  return DATA_CLASSIFICATION[level].encryptionAtRest;
}

export function requiresMasking(level: DataSensitivityLevel): boolean {
  return DATA_CLASSIFICATION[level].maskingRequired;
}
