// src/app/[locale]/candidate/dashboard/page.tsx — Candidate dashboard: application history
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const t = {
  es: {
    title: "Mis Postulaciones",
    subtitle: "Revisa el estado de tus postulaciones",
    loading: "Cargando...",
    loginRequired: "Debes iniciar sesión para ver tus postulaciones",
    loginBtn: "Iniciar sesión",
    noApplications: "Aún no tienes postulaciones",
    findJobsBtn: "Buscar empleos",
    appliedOn: "Postulado el",
    status: "Estado",
    pending: "Enviada",
    reviewed: "Revisada",
    accepted: "Aceptada",
    rejected: "No seleccionada",
    timeline: "Historial",
    contactEmployer: "Contactar empresa",
    messagePlaceholder: "Escribe tu mensaje...",
    send: "Enviar",
    sending: "Enviando...",
    messageSent: "Mensaje enviado ✓",
    cannotContact: "No es posible contactar en el estado actual",
    errorLoad: "Error al cargar tus postulaciones",
    errorContact: "Error al enviar el mensaje",
    close: "Cerrar",
    noInteractions: "Sin mensajes aún",
    refreshBtn: "Actualizar",
  },
  en: {
    title: "My Applications",
    subtitle: "Track the status of your job applications",
    loading: "Loading...",
    loginRequired: "You must sign in to see your applications",
    loginBtn: "Sign in",
    noApplications: "You haven't applied to any jobs yet",
    findJobsBtn: "Find jobs",
    appliedOn: "Applied on",
    status: "Status",
    pending: "Submitted",
    reviewed: "Reviewed",
    accepted: "Accepted",
    rejected: "Not selected",
    timeline: "Timeline",
    contactEmployer: "Contact employer",
    messagePlaceholder: "Write your message...",
    send: "Send",
    sending: "Sending...",
    messageSent: "Message sent ✓",
    cannotContact: "Cannot contact employer at this status",
    errorLoad: "Error loading your applications",
    errorContact: "Error sending message",
    close: "Close",
    noInteractions: "No messages yet",
    refreshBtn: "Refresh",
  },
};

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_display?: string;
  status: string;
  created_at?: { _seconds: number };
  updated_at?: { _seconds: number };
}

interface Interaction {
  id: string;
  type: string;
  subject?: string;
  body: string;
  created_at?: { _seconds: number };
  is_public: boolean;
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

export default function CandidateDashboard() {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "en" ? "en" : "es";
  const l = t[lang];
  const { user, loading: authLoading, openLogin } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentAppId, setSentAppId] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.ok) {
        setApplications(data.data?.applications || []);
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
    if (!authLoading && user && !user.employer_id) {
      fetchApps();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, fetchApps]);

  const toggleExpand = async (appId: string) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
      return;
    }
    setExpandedApp(appId);
    setMessage("");
    setSentAppId(null);
    setLoadingInteractions(true);
    try {
      const res = await fetch(`/api/applications/${appId}`);
      const data = await res.json();
      if (data.ok) {
        setInteractions(data.data?.interactions || []);
      } else {
        setInteractions([]);
      }
    } catch {
      setInteractions([]);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const sendMessage = async (appId: string) => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/applications/${appId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("");
        setSentAppId(appId);
        toggleExpand(appId).then(() => toggleExpand(appId)); // refresh timeline
      } else {
        alert(data.error || l.errorContact);
      }
    } catch {
      alert(l.errorContact);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (ts?: { _seconds: number }) => {
    if (!ts?._seconds) return "";
    return new Date(ts._seconds * 1000).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const closedStatuses = ["rejected"];

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

  return (
    <main className="min-h-screen pb-24">
      <section className="pt-24 pb-8 text-center px-4 bg-gradient-to-b from-blue-950/60 to-transparent">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{l.title}</h1>
        <p className="text-slate-400 mb-4">{l.subtitle}</p>
        <button onClick={fetchApps} disabled={loading} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition disabled:opacity-50">
          {l.refreshBtn}
        </button>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-4">
        {(authLoading || loading) && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400">{l.loading}</p>
          </div>
        )}

        {error && <p className="text-red-400 text-center py-8">{error}</p>}

        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-400 mb-4">{l.noApplications}</p>
            <a href={`/${locale}/jobs`} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition inline-block">
              {l.findJobsBtn}
            </a>
          </div>
        )}

        {!loading && !error && applications.map((app) => (
          <div key={app.id} className="mb-4 bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => toggleExpand(app.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-700/30 transition text-left"
            >
              <div className="min-w-0">
                <h3 className="text-white font-semibold truncate">{app.job_title}</h3>
                {app.company_display && (
                  <p className="text-sm text-slate-400 truncate">{app.company_display}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">{l.appliedOn} {formatDate(app.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={app.status} l={l} />
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${expandedApp === app.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedApp === app.id && (
              <div className="border-t border-slate-700 px-6 py-4 space-y-4 bg-slate-900/30">
                {/* Timeline */}
                <div>
                  <span className="text-xs text-slate-500 uppercase">{l.timeline}</span>
                  {loadingInteractions ? (
                    <p className="text-sm text-slate-500 mt-2">{l.loading}</p>
                  ) : interactions.length === 0 ? (
                    <p className="text-sm text-slate-500 mt-2">{l.noInteractions}</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {interactions.map((i) => (
                        <li key={i.id} className="text-sm bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700/50">
                          <p className="text-slate-300">{i.body}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatDate(i.created_at)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Contact form */}
                <div>
                  <span className="text-xs text-slate-500 uppercase mb-2 block">{l.contactEmployer}</span>
                  {closedStatuses.includes(app.status) ? (
                    <p className="text-sm text-slate-500 italic">{l.cannotContact}</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={sentAppId === app.id ? "" : message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={l.messagePlaceholder}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => sendMessage(app.id)}
                        disabled={sending || !message.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                      >
                        {sending ? l.sending : l.send}
                      </button>
                    </div>
                  )}
                  {sentAppId === app.id && (
                    <p className="text-sm text-green-400 mt-2">{l.messageSent}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
