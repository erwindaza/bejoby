"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import JobApplyForm from "@/components/JobApplyForm";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: string;
  work_mode?: string;
  employer_id: string;
  language: string;
  status: string;
  created_at: string;
}

const typeLabelsMap = {
  es: { "full-time": "Tiempo completo", "part-time": "Medio tiempo", contract: "Contrato", freelance: "Freelance" } as Record<string, string>,
  en: { "full-time": "Full-time", "part-time": "Part-time", contract: "Contract", freelance: "Freelance" } as Record<string, string>,
};

const workModeLabelsMap = {
  es: { remote: "100% Remoto", hybrid: "Híbrido", "on-site": "Presencial" } as Record<string, string>,
  en: { remote: "Remote", hybrid: "Hybrid", "on-site": "On-site" } as Record<string, string>,
};

const texts = {
  es: {
    loading: "Cargando oferta...",
    notFound: "Oferta no encontrada",
    loadError: "Error al cargar la oferta",
    back: "← Volver a ofertas",
    published: "Publicada",
    description: "Descripción del puesto",
    details: "Detalles",
    location: "Ubicación",
    locationNA: "No especificada",
    contractType: "Tipo de contrato",
    workMode: "Modalidad",
    salary: "Salario",
    salaryNA: "A convenir",
    language: "Idioma",
    langEs: "Español",
    langEn: "English",
    apply: "Postularme a esta oferta",
    applied: "✅ Postulación enviada",
  },
  en: {
    loading: "Loading job...",
    notFound: "Job not found",
    loadError: "Error loading job",
    back: "← Back to listings",
    published: "Published",
    description: "Job description",
    details: "Details",
    location: "Location",
    locationNA: "Not specified",
    contractType: "Contract type",
    workMode: "Work mode",
    salary: "Salary",
    salaryNA: "To be discussed",
    language: "Language",
    langEs: "Spanish",
    langEn: "English",
    apply: "Apply to this job",
    applied: "✅ Application submitted",
  },
};

export default function JobDetailPage() {
  const params = useParams<{ locale: string; id: string }>();
  const locale = params.locale;
  const jobId = params.id;
  const lang = locale === "en" ? "en" : "es";
  const t = texts[lang];
  const typeLabels = typeLabelsMap[lang];
  const workModeLabels = workModeLabelsMap[lang];

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [applied, setApplied] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      if (data.ok) setJob(data.data);
      else setError(t.notFound);
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [jobId, t.notFound, t.loadError]);

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId, fetchJob]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">{error || t.notFound}</h1>
          <Link href={`/${locale}/jobs`} className="text-blue-400 hover:text-blue-300 underline">{t.back}</Link>
        </div>
      </main>
    );
  }

  const date = job.created_at
    ? new Date(job.created_at).toLocaleDateString(lang === "es" ? "es-CL" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <main className="min-h-screen pb-24">
      <section className="pt-24 pb-12 bg-gradient-to-b from-blue-950/60 to-transparent text-white px-4">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${locale}/jobs`} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">{t.back}</Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{job.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            {job.location && <span>📍 {job.location}</span>}
            {job.salary_range && <span>💰 {job.salary_range}</span>}
            <span>📋 {typeLabels[job.employment_type] || job.employment_type}</span>
            {job.work_mode && <span>🏢 {workModeLabels[job.work_mode] || job.work_mode}</span>}
            {date && <span>📅 {t.published}: {date}</span>}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">{t.description}</h2>
            <div className="prose prose-invert max-w-none">
              {job.description.split("\n").map((p, i) => (
                <p key={i} className="text-gray-300 mb-3">{p}</p>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
              <h3 className="text-white font-semibold mb-4">{t.details}</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">{t.location}</dt>
                  <dd className="text-white">{job.location || t.locationNA}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.contractType}</dt>
                  <dd className="text-white">{typeLabels[job.employment_type] || job.employment_type}</dd>
                </div>
                {job.work_mode && (
                <div>
                  <dt className="text-gray-500">{t.workMode}</dt>
                  <dd className="text-white">{workModeLabels[job.work_mode] || job.work_mode}</dd>
                </div>
                )}
                <div>
                  <dt className="text-gray-500">{t.salary}</dt>
                  <dd className="text-white">{job.salary_range || t.salaryNA}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.language}</dt>
                  <dd className="text-white">{job.language === "es" ? t.langEs : t.langEn}</dd>
                </div>
              </dl>
            </div>

            {!applied && !showApply && (
              <button onClick={() => setShowApply(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-center">
                {t.apply}
              </button>
            )}

            {applied && (
              <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-xl text-center">
                <p className="text-green-300 font-semibold">{t.applied}</p>
              </div>
            )}
          </div>
        </div>

        {showApply && !applied && (
          <div className="mt-12 max-w-xl mx-auto">
            <JobApplyForm jobId={job.id} jobTitle={job.title} locale={lang} onSuccess={() => { setApplied(true); setShowApply(false); }} />
          </div>
        )}
      </section>
    </main>
  );
}
