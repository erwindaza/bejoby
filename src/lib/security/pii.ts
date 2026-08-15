import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";

const ENCRYPTION_KEY_ENV = "FIELD_ENCRYPTION_KEY";
const HASH_KEY_ENV = "FIELD_HASH_KEY";
const ALGORITHM = "aes-256-gcm";
const KEY_VERSION = "v1";

export interface EncryptedField {
  alg: typeof ALGORITHM;
  key_version: typeof KEY_VERSION;
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface CandidatePIIInput {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  resume_url?: string;
  resume_text?: string;
}

export interface ApplicationPIIInput {
  candidate_name: string;
  candidate_email: string;
  resume_url?: string;
  message?: string;
}

function sanitizeText(value: string, maxLength: number): string {
  return value.replace(/\0/g, "").trim().slice(0, maxLength);
}

function readKeyMaterial(envName: string): string {
  const value = (process.env[envName] || "").trim();
  if (!value) {
    throw new Error(`Missing ${envName} environment variable`);
  }
  return value;
}

function normalizeKey(raw: string): Buffer {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  try {
    const base64 = Buffer.from(trimmed, "base64");
    if (base64.length === 32) return base64;
  } catch {
    // Fall through to derived key.
  }
  return createHash("sha256").update(trimmed).digest();
}

function getEncryptionKey(): Buffer {
  return normalizeKey(readKeyMaterial(ENCRYPTION_KEY_ENV));
}

function getHashKey(): Buffer {
  const value = (process.env[HASH_KEY_ENV] || "").trim();
  return normalizeKey(value || readKeyMaterial(ENCRYPTION_KEY_ENV));
}

function isEncryptedField(value: unknown): value is EncryptedField {
  return Boolean(
    value
      && typeof value === "object"
      && "ciphertext" in value
      && "iv" in value
      && "tag" in value,
  );
}

export function encryptString(value: string): EncryptedField {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    alg: ALGORITHM,
    key_version: KEY_VERSION,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

export function decryptString(value: unknown): string {
  if (typeof value === "string") return value;
  if (!isEncryptedField(value)) return "";

  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export function hashForLookup(value: string): string {
  return createHmac("sha256", getHashKey())
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function encryptCandidatePII(input: CandidatePIIInput) {
  return {
    name: encryptString(sanitizeText(input.name, 200)),
    email: encryptString(sanitizeText(input.email, 320).toLowerCase()),
    phone: encryptString(sanitizeText(input.phone || "", 30)),
    linkedin: encryptString(sanitizeText(input.linkedin || "", 500)),
    resume_url: encryptString(sanitizeText(input.resume_url || "", 2000)),
    resume_text: encryptString(sanitizeText(input.resume_text || "", 50000)),
  };
}

export function decryptCandidatePII(data: Record<string, unknown>) {
  const pii = (data.pii as Record<string, unknown> | undefined) || {};
  return {
    ...data,
    name: decryptString(pii.name ?? data.name),
    email: decryptString(pii.email ?? data.email),
    phone: decryptString(pii.phone ?? data.phone),
    linkedin: decryptString(pii.linkedin ?? data.linkedin),
    resume_url: decryptString(pii.resume_url ?? data.resume_url),
    resume_text: decryptString(pii.resume_text ?? data.resume_text),
  };
}

export function buildEncryptedCandidateRecord(input: CandidatePIIInput) {
  return {
    pii_encrypted: true,
    email_hash: hashForLookup(input.email),
    pii: encryptCandidatePII(input),
  };
}

export function redactCandidateRecord(id: string, data: Record<string, unknown>) {
  const hydrated = decryptCandidatePII(data) as Record<string, unknown>;
  return {
    id,
    language: hydrated.language || "es",
    consent_privacy: hydrated.consent_privacy === true,
    consent_data_processing: hydrated.consent_data_processing === true,
    pii_encrypted: hydrated.pii_encrypted === true,
    created_at: hydrated.created_at || null,
    updated_at: hydrated.updated_at || null,
    has_resume_text: Boolean(hydrated.resume_text),
    has_linkedin: Boolean(hydrated.linkedin),
  };
}

export function encryptApplicationPII(input: ApplicationPIIInput) {
  return {
    application_pii_encrypted: true,
    candidate_email_hash: hashForLookup(input.candidate_email),
    pii: {
      candidate_name: encryptString(sanitizeText(input.candidate_name, 200)),
      candidate_email: encryptString(sanitizeText(input.candidate_email, 320).toLowerCase()),
      resume_url: encryptString(sanitizeText(input.resume_url || "", 2000)),
      message: encryptString(sanitizeText(input.message || "", 2000)),
    },
  };
}

export function decryptApplicationPII(data: Record<string, unknown>) {
  const pii = (data.pii as Record<string, unknown> | undefined) || {};
  return {
    ...data,
    candidate_name: decryptString(pii.candidate_name ?? data.candidate_name),
    candidate_email: decryptString(pii.candidate_email ?? data.candidate_email),
    resume_url: decryptString(pii.resume_url ?? data.resume_url),
    message: decryptString(pii.message ?? data.message),
  };
}

export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const [local, domain] = normalized.split("@");
  if (!local || !domain) return "";
  const visibleLocal = local.length <= 2 ? local[0] || "" : `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}`;
  const [domainName, ...rest] = domain.split(".");
  const visibleDomain = domainName.length <= 2
    ? `${domainName[0] || ""}*`
    : `${domainName.slice(0, 2)}${"*".repeat(Math.max(1, domainName.length - 2))}`;
  return `${visibleLocal}@${[visibleDomain, ...rest].filter(Boolean).join(".")}`;
}

export function maskName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "Candidate";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return `${parts[0][0]}${"*".repeat(Math.max(1, parts[0].length - 1))}`;
  return parts.map((part, index) => index === 0 ? part : `${part[0]}${"*".repeat(Math.max(1, part.length - 1))}`).join(" ");
}

export function buildEmployerSafeApplicationView(id: string, data: Record<string, unknown>) {
  const hydrated = decryptApplicationPII(data) as Record<string, unknown>;
  const safeName = maskName(String(hydrated.candidate_name || ""));
  const aiAnalysis = typeof hydrated.ai_analysis === "object" && hydrated.ai_analysis
    ? hydrated.ai_analysis as Record<string, unknown>
    : null;

  return {
    id,
    job_id: hydrated.job_id || null,
    candidate_id: hydrated.candidate_id || null,
    candidate_name: safeName,
    candidate_email_masked: maskEmail(String(hydrated.candidate_email || "")),
    message: hydrated.message || "",
    status: hydrated.status || "pending",
    cv_path: hydrated.cv_path || "",
    cv_filename: hydrated.cv_filename || "",
    consent_share_data: hydrated.consent_share_data === true || hydrated.consent_shared === true,
    created_at: hydrated.created_at || null,
    updated_at: hydrated.updated_at || null,
    application_pii_encrypted: hydrated.application_pii_encrypted === true,
    ai_analysis: aiAnalysis ? {
      score: aiAnalysis.score ?? null,
      summary: aiAnalysis.summary ?? "",
      strengths: Array.isArray(aiAnalysis.strengths) ? aiAnalysis.strengths : [],
      gaps: Array.isArray(aiAnalysis.gaps) ? aiAnalysis.gaps : [],
      recommendation: aiAnalysis.recommendation ?? "",
      analyzed_at: aiAnalysis.analyzed_at ?? null,
    } : null,
  };
}
