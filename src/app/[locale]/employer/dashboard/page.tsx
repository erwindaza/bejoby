// src/app/[locale]/employer/dashboard/page.tsx — Employer dashboard: view jobs, applications, AI scores
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

const t = {
  es: {
    title: "Panel del Empleador",
    subtitle: "Gestiona tus ofertas y postulaciones",
    loading: "Cargando...",
    loginRequired: "Debes iniciar sesión para acceder al panel",
    loginBtn: "Iniciar sesión",
    noEmployer: "Primero debes registrar tu empresa",
    registerBtn: "Registrar empresa",
    noJobs: "Aún no tienes ofertas publicadas.",
    postJobBtn: "Publicar oferta",
    applications: "Postulaciones",
    noApplications: "Sin postulaciones aún",
    candidate: "Candidato",
    email: "Email",
    message: "Mensaje",
    status: "Estado",
    aiScore: "Score IA",
    aiSummary: "Resumen IA",
    strengths: "Fortalezas",
    gaps: "Brechas",
    recommendation: "Recomendación",
    cv: "CV",
    downloadCv: "Descargar CV",
    noCv: "Sin CV",
    pending: "Pendiente",
    reviewed: "Revisada",
    accepted: "Aceptada",
    rejected: "Rechazada",
    changeStatus: "Cambiar estado",
    updatingStatus: "Actualizando...",
    score: "pts",
    appliedOn: "Postulado el",
    analysisNotReady: "Análisis pendiente",
    refreshBtn: "Actualizar",
    errorLoad: "Error al cargar postulaciones",
    errorStatus: "Error al actualizar estado",
  },
  en: {
    title: "Employer Dashboard",
    subtitle: "Manage your jobs and applications",
    loading: "Loading...",
    loginRequired: "You must sign in to access the dashboard",
    loginBtn: "Sign in",
    noEmployer: "You must register your company first",
    registerBtn: "Register company",
    noJobs: "You haven't posted any jobs yet.",
    postJobBtn: "Post a job",
    applications: "Applications",
    noApplications: "No applications yet",
    candidate: "Candidate",
    email: "Email",
    message: "Message",
    status: "Status",
    aiScore: "AI Score",
    aiSummary: "AI Summary",
    strengths: "Strengths",
    gaps: "Gaps",
    recommendation: "Recommendation",
    cv: "CV",
    downloadCv: "Download CV",
    noCv: "No CV",
    pending: "Pending",
    reviewed: "Reviewed",
    accepted: "Accepted",
    rejected: "Rejected",
    changeStatus: "Change status",
    updatingStatus: "Updating...",
    score: "pts",
    appliedOn: "Applied on",
    analysisNotReady: "Analysis pending",
    refreshBtn: "Refresh",
    errorLoad: "Error loading applications",
    errorStatus: "Error updating status",
  },
};

const STATUS_OPTIONS = ["pending", "reviewed", "accepted", "rejected"] as const;

interface AiAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  analyzed_at: string;
}

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
  message?: string;
  status: string;
  cv_path?: string;
  cv_filename?: string;
  ai_analysis?: AiAnalysis;
  created_at?: { _seconds: number };
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-600/20 text-green-400 border-green-600/40" :
    score >= 60 ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/40" :
    score >= 40 ? "bg-orange-600/20 text-orange-400 border-orange-600/40" :
    "bg-red-600/20 text-red-400 border-red-600/40";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold border ${color}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status, l }: { status: string; l: typeof t.es }) {
  const map: Record<string, string> = {
    pending: "bg-slate-600/20 text-slate-300 border-slate-500/40",
    reviewed: "bg-blue-600/20 text-blue-400 border-blue-500/40",
    accepted: "bg-green-600/20 text-green-400 border-green-500/40",
    rejected: "bg-red-600/20 text-red-400 border-red-500/40",
  };
  const labels: Record<string, string> = {
    pending: l.pending, reviewed: l.reviewed, accepted: l.accepted, rejected: l.rejected,
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export default function EmployerDashboard() {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "en" ? "en" : "es";
  const l = t[lang];
  const { user, loading: authLoading, openLogin } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.ok) {
        setApplications(data.data || []);
      } else {
        setError(data.error || l.errorLoad);
      }
    } catch {
      setError(l.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [l.errorLoad]);

  useEffect(() => {
    if (!authLoading && user?.employer_id) {
      fetchApps();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchApps]);

  const updateStatus = async (appId: string, newStatus: string) => {
    setUpdatingStatus(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
      } else {
        alert(l.errorStatus);
      }
    } catch {
      alert(l.errorStatus);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const downloadCv = (cvPath: string) => {
    window.open(`/api/cv/download?path=${encodeURIComponent(cvPath)}`, "_blank");
  };

  // Group applications by job
  const jobGroups = applications.reduce<Record<string, { title: string; apps: Application[] }>>((acc, app) => {
    if (!acc[app.job_id]) {
      acc[app.job_id] = { title: app.job_title, apps: [] };
    }
    acc[app.job_id].apps.push(app);
    return acc;
  }, {});

  const formatDate = (ts?: { _seconds: number }) => {
    if (!ts?._seconds) return "";
    return new Date(ts._seconds * 1000).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  // Auth gate
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen pb-24">
        <section className="pt-24 text-center px-4">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-3">{l.loginRequired}</h2>
          <button onClick={openLogin} className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition">
            {l.loginBtn}
          </button>
        </section>
      </main>
    );
  }

  if (!authLoading && user && !user.employer_id) {
    return (
      <main className="min-h-screen pb-24">
        <section className="pt-24 text-center px-4">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-white mb-3">{l.noEmployer}</h2>
          <Link href={`/${locale}/post-job`} className="mt-4 inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition">
            {l.registerBtn}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <section className="pt-24 pb-8 text-center px-4 bg-gradient-to-b from-blue-950/60 to-transparent">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{l.title}</h1>
        <p className="text-slate-400 mb-4">{l.subtitle}</p>
        <div className="flex justify-center gap-3">
          <button onClick={fetchApps} disabled={loading} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition disabled:opacity-50">
            {l.refreshBtn}
          </button>
          <Link href={`/${locale}/post-job`} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition">
            {l.postJobBtn}
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-4">
        {/* Loading */}
        {(authLoading || loading) && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400">{l.loading}</p>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-center py-8">{error}</p>}

        {/* No jobs */}
        {!loading && !error && Object.keys(jobGroups).length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-400 mb-4">{l.noJobs}</p>
            <Link href={`/${locale}/post-job`} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition">
              {l.postJobBtn}
            </Link>
          </div>
        )}

        {/* Job groups */}
        {!loading && !error && Object.entries(jobGroups).map(([jobId, group]) => (
          <div key={jobId} className="mb-6 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            {/* Job header */}
            <button
              onClick={() => setExpandedJob(expandedJob === jobId ? null : jobId)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-700/30 transition text-left"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                <p className="text-sm text-slate-400">
                  {group.apps.length} {l.applications.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Mini score summary */}
                {group.apps.some((a) => a.ai_analysis?.score != null) && (
                  <span className="text-xs text-slate-500">
                    avg: {Math.round(
                      group.apps.filter((a) => a.ai_analysis?.score != null)
                        .reduce((s, a) => s + (a.ai_analysis?.score || 0), 0) /
                      group.apps.filter((a) => a.ai_analysis?.score != null).length
                    )} {l.score}
                  </span>
                )}
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedJob === jobId ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Applications list */}
            {expandedJob === jobId && (
              <div className="border-t border-slate-700">
                {group.apps.length === 0 && (
                  <p className="text-slate-500 text-sm px-6 py-4">{l.noApplications}</p>
                )}
                {group.apps.map((app) => (
                  <div key={app.id} className="border-b border-slate-700/50 last:border-b-0">
                    {/* Application row */}
                    <button
                      onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                      className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-700/20 transition text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-300 shrink-0">
                          {app.candidate_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm truncate">{app.candidate_name}</p>
                          <p className="text-slate-500 text-xs">{formatDate(app.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {app.ai_analysis?.score != null && <ScoreBadge score={app.ai_analysis.score} />}
                        <StatusBadge status={app.status} l={l} />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expandedApp === app.id && (
                      <div className="px-6 pb-4 space-y-4 bg-slate-900/30">
                        {/* Contact & CV */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <span className="text-xs text-slate-500 uppercase">{l.email}</span>
                            <p className="text-sm text-slate-300">{app.candidate_email}</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 uppercase">{l.cv}</span>
                            {app.cv_path ? (
                              <button
                                onClick={() => downloadCv(app.cv_path!)}
                                className="block text-sm text-blue-400 hover:text-blue-300 transition"
                              >
                                {app.cv_filename || l.downloadCv} ↓
                              </button>
                            ) : (
                              <p className="text-sm text-slate-500">{l.noCv}</p>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        {app.message && (
                          <div>
                            <span className="text-xs text-slate-500 uppercase">{l.message}</span>
                            <p className="text-sm text-slate-300 whitespace-pre-line mt-1">{app.message}</p>
                          </div>
                        )}

                        {/* AI Analysis */}
                        {app.ai_analysis ? (
                          <div className="bg-slate-800/60 rounded-lg p-4 space-y-3 border border-slate-700/50">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <span className="text-blue-400">✦</span> {l.aiScore}
                              </h4>
                              <ScoreBadge score={app.ai_analysis.score} />
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 uppercase">{l.aiSummary}</span>
                              <p className="text-sm text-slate-300 mt-1">{app.ai_analysis.summary}</p>
                            </div>
                            {app.ai_analysis.strengths.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase">{l.strengths}</span>
                                <ul className="mt-1 space-y-1">
                                  {app.ai_analysis.strengths.map((s, i) => (
                                    <li key={i} className="text-sm text-green-400 flex items-start gap-1.5">
                                      <span className="mt-0.5">✓</span> {s}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {app.ai_analysis.gaps.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase">{l.gaps}</span>
                                <ul className="mt-1 space-y-1">
                                  {app.ai_analysis.gaps.map((g, i) => (
                                    <li key={i} className="text-sm text-orange-400 flex items-start gap-1.5">
                                      <span className="mt-0.5">△</span> {g}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div>
                              <span className="text-xs text-slate-500 uppercase">{l.recommendation}</span>
                              <p className="text-sm text-slate-300 mt-1">{app.ai_analysis.recommendation}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">{l.analysisNotReady}</p>
                        )}

                        {/* Status update */}
                        <div>
                          <span className="text-xs text-slate-500 uppercase mb-2 block">{l.changeStatus}</span>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                onClick={() => updateStatus(app.id, s)}
                                disabled={app.status === s || updatingStatus === app.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                  app.status === s
                                    ? "bg-blue-600 text-white cursor-default"
                                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                } disabled:opacity-50`}
                              >
                                {updatingStatus === app.id ? l.updatingStatus : (l as Record<string, string>)[s] || s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
