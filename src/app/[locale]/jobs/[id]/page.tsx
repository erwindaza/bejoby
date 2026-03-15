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
  employer_id: string;
  language: string;
  status: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  "full-time": "Tiempo completo",
  "part-time": "Medio tiempo",
  contract: "Contrato",
  freelance: "Freelance",
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showApply, setShowApply] = useState(false);
  const [applied, setApplied] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      if (data.ok) {
        setJob(data.data);
      } else {
        setError("Oferta no encontrada");
      }
    } catch {
      setError("Error al cargar la oferta");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId, fetchJob]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando oferta...</p>
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            {error || "Oferta no encontrada"}
          </h1>
          <Link
            href="/jobs"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            ← Volver a ofertas
          </Link>
        </div>
      </main>
    );
  }

  const date = job.created_at
    ? new Date(job.created_at).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <section className="pt-28 pb-12 bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/jobs"
            className="text-indigo-200 hover:text-white text-sm mb-4 inline-block"
          >
            ← Volver a ofertas
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            {job.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-indigo-100/80">
            {job.location && (
              <span className="flex items-center gap-1">📍 {job.location}</span>
            )}
            {job.salary_range && (
              <span className="flex items-center gap-1">💰 {job.salary_range}</span>
            )}
            <span className="flex items-center gap-1">
              📋 {typeLabels[job.employment_type] || job.employment_type}
            </span>
            {date && (
              <span className="flex items-center gap-1">📅 Publicada: {date}</span>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Description */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">
              Descripción del puesto
            </h2>
            <div className="prose prose-invert max-w-none">
              {job.description.split("\n").map((paragraph, i) => (
                <p key={i} className="text-gray-300 mb-3">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info */}
            <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
              <h3 className="text-white font-semibold mb-4">Detalles</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Ubicación</dt>
                  <dd className="text-white">{job.location || "No especificada"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Tipo de contrato</dt>
                  <dd className="text-white">
                    {typeLabels[job.employment_type] || job.employment_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Salario</dt>
                  <dd className="text-white">{job.salary_range || "A convenir"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Idioma</dt>
                  <dd className="text-white">{job.language === "es" ? "Español" : "English"}</dd>
                </div>
              </dl>
            </div>

            {/* Apply button */}
            {!applied && !showApply && (
              <button
                onClick={() => setShowApply(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all text-center"
              >
                Postularme a esta oferta
              </button>
            )}

            {applied && (
              <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-xl text-center">
                <p className="text-green-300 font-semibold">
                  ✅ Postulación enviada
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Apply Form */}
        {showApply && !applied && (
          <div className="mt-12 max-w-xl mx-auto">
            <JobApplyForm
              jobId={job.id}
              jobTitle={job.title}
              locale="es"
              onSuccess={() => {
                setApplied(true);
                setShowApply(false);
              }}
            />
          </div>
        )}
      </section>
    </main>
  );
}
