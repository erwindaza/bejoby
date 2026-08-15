import { candidates } from "@/lib/gcp/collections";
import { decryptCandidatePII } from "@/lib/security/pii";

export interface CandidateGameState {
  candidate_id: string;
  name: string;
  profile_completion: number;
  profile_level: string;
  game_points: number;
  fit_score?: number;
  next_action: string;
  badges: string[];
  pending_tasks: string[];
  updated_at: string;
}

const PROFILE_KEYS = [
  "email",
  "phone",
  "salary_expected",
  "english_level",
  "availability",
  "location",
  "consent_shared",
  "cv_path",
  "summary",
];

function normalizeCompletionCount(candidate: Record<string, unknown>): number {
  let completed = 0;
  for (const key of PROFILE_KEYS) {
    const value = candidate[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (key === "consent_shared" && value !== true) continue;
    completed += 1;
  }
  return Math.round((completed / PROFILE_KEYS.length) * 100);
}

function buildPendingTasks(candidate: Record<string, unknown>): string[] {
  const tasks: string[] = [];
  if (!candidate.email) tasks.push("Completar email de contacto");
  if (!candidate.phone) tasks.push("Agregar teléfono o WhatsApp");
  if (!candidate.salary_expected) tasks.push("Ingresar expectativa salarial");
  if (!candidate.english_level) tasks.push("Seleccionar nivel de inglés");
  if (!candidate.availability) tasks.push("Indicar disponibilidad");
  if (!candidate.location) tasks.push("Definir ubicación o modalidad");
  if (!candidate.consent_shared) tasks.push("Aceptar compartir tu perfil con partners");
  if (!candidate.cv_path) tasks.push("Subir tu CV");
  if (!candidate.summary) tasks.push("Generar tu resumen profesional");
  return tasks;
}

function computeBadges(candidate: Record<string, unknown>, profileCompletion: number): string[] {
  const badges: string[] = [];
  if (candidate.cv_path) badges.push("CV Ready");
  if (profileCompletion >= 80) badges.push("Perfil Completo");
  if (candidate.salary_expected && candidate.english_level && candidate.availability) {
    badges.push("Listo para entrevistas");
  }
  if (candidate.fit_score && typeof candidate.fit_score === "number" && candidate.fit_score >= 75) {
    badges.push("Match Strong");
  }
  if (candidate.consent_shared) badges.push("Partner Friendly");
  return badges;
}

function computeProfileLevel(profileCompletion: number): string {
  if (profileCompletion >= 90) return "Experto";
  if (profileCompletion >= 70) return "Avanzado";
  if (profileCompletion >= 50) return "Intermedio";
  return "Iniciado";
}

export async function getCandidateGameState(candidateId: string): Promise<CandidateGameState | null> {
  const doc = await candidates().doc(candidateId).get();
  if (!doc.exists) return null;
  const data = decryptCandidatePII(doc.data() as Record<string, unknown>) as Record<string, unknown>;

  const profileCompletion = normalizeCompletionCount(data);
  const pendingTasks = buildPendingTasks(data);
  const badges = computeBadges(data, profileCompletion);
  const profileLevel = computeProfileLevel(profileCompletion);
  const pointsFromProfile = Math.round((profileCompletion / 100) * 100);
  const pointsFromBadges = badges.length * 10;
  const fitScore = typeof data.fit_score === "number" ? data.fit_score : undefined;
  const totalPoints = pointsFromProfile + pointsFromBadges + (fitScore ? Math.round(fitScore / 10) : 0);

  let nextAction = "Completa tu perfil para aumentar tus posibilidades.";
  if (pendingTasks.length > 0) {
    nextAction = `Primero: ${pendingTasks[0]}`;
  } else if (fitScore && fitScore < 60) {
    nextAction = "Mejora tu CV o agrega experiencia relevante para subir tu calce.";
  } else if (fitScore && fitScore >= 60) {
    nextAction = "Tu perfil está listo para ser enviado a un partner.";
  }

  return {
    candidate_id: candidateId,
    name: (data.name as string) || "Candidato",
    profile_completion: profileCompletion,
    profile_level: profileLevel,
    game_points: totalPoints,
    fit_score: fitScore,
    next_action: nextAction,
    badges,
    pending_tasks: pendingTasks,
    updated_at: new Date().toISOString(),
  };
}
