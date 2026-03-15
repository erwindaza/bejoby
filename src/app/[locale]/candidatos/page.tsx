"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CandidateRegisterForm from "@/components/CandidateRegisterForm";
import CVHarvardConverter from "@/components/CVHarvardConverter";

export default function CandidatosPage() {
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "register" | "cv" | "jobs">("info");

  useEffect(() => {
    const saved = localStorage.getItem("bejoby_candidate_id");
    if (saved) {
      setCandidateId(saved);
    }
  }, []);

  return (
    <main className="min-h-screen pb-24">
      {/* Hero Section */}
      <section className="pt-28 pb-16 text-center bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Potencia tu carrera con coaching y herramientas prácticas
          </h1>
          <p className="text-lg mb-8 text-indigo-100/90">
            Regístrate, convierte tu CV al formato Harvard con IA y postula a las mejores ofertas laborales.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActiveTab(candidateId ? "cv" : "register")}
              className="px-6 py-3 bg-white text-purple-700 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              {candidateId ? "Convertir mi CV" : "Registrarme"}
            </button>
            <Link
              href="/jobs"
              className="px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition"
            >
              Ver ofertas de empleo
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-3">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "info"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Servicios
          </button>
          {!candidateId && (
            <button
              onClick={() => setActiveTab("register")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "register"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              📝 Registrarme
            </button>
          )}
          <button
            onClick={() => setActiveTab("cv")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "cv"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            📄 CV Harvard
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "jobs"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            💼 Ofertas de empleo
          </button>
        </div>
      </section>

      {/* Tab Content */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        {/* Info / Services */}
        {activeTab === "info" && (
          <div className="space-y-16">
            {/* Qué ofrecemos */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Qué ofrecemos</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <h3 className="text-white font-semibold mb-2">Revisión profesional de CV</h3>
                  <p className="text-gray-400 text-sm">
                    Ajustamos formato, palabras clave y logros cuantificados para que
                    tu CV supere filtros ATS y atraiga reclutadores.
                  </p>
                </div>
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <h3 className="text-white font-semibold mb-2">Simulacros de entrevista</h3>
                  <p className="text-gray-400 text-sm">
                    Entrevistas grabadas y feedback accionable: técnica, comunicación y cultura.
                  </p>
                </div>
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <h3 className="text-white font-semibold mb-2">Plan de carrera</h3>
                  <p className="text-gray-400 text-sm">
                    Roadmap personalizado: habilidades, cursos recomendados y objetivos a 3/6/12 meses.
                  </p>
                </div>
              </div>
            </div>

            {/* Cómo trabajamos */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Cómo trabajamos</h3>
              <ol className="space-y-4">
                <li className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <strong className="block text-white">1. Diagnóstico</strong>
                  <span className="text-sm text-gray-400">
                    Evaluamos tu CV y perfil para identificar tus fortalezas y áreas de mejora.
                  </span>
                </li>
                <li className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <strong className="block text-white">2. Entrenamiento</strong>
                  <span className="text-sm text-gray-400">
                    Sesiones prácticas con feedback accionable en tiempo real.
                  </span>
                </li>
                <li className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <strong className="block text-white">3. Entrevistas y seguimiento</strong>
                  <span className="text-sm text-gray-400">
                    Simulacros, ajustes finales y roadmap post-entrevista.
                  </span>
                </li>
              </ol>
            </div>

            {/* Testimonios */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-8">Historias de éxito</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <blockquote className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                  <p className="italic text-gray-300">
                    &quot;Gracias a BeJoby logré mi primera oferta en tecnología. El simulacro de entrevistas fue clave.&quot;
                  </p>
                  <footer className="mt-4 font-semibold text-purple-400">— Camila R.</footer>
                </blockquote>
                <blockquote className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                  <p className="italic text-gray-300">
                    &quot;Me ayudaron a rediseñar mi CV y a ganar confianza. ¡Hoy trabajo en una multinacional!&quot;
                  </p>
                  <footer className="mt-4 font-semibold text-purple-400">— Andrés M.</footer>
                </blockquote>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                Da el siguiente paso en tu carrera
              </h3>
              <p className="mb-6 text-gray-400">
                Regístrate, convierte tu CV con IA y postula a ofertas reales.
              </p>
              <button
                onClick={() => setActiveTab(candidateId ? "cv" : "register")}
                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
              >
                {candidateId ? "Ir a CV Harvard" : "Registrarme ahora"}
              </button>
            </div>
          </div>
        )}

        {/* Register */}
        {activeTab === "register" && !candidateId && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Crea tu perfil de candidato
            </h2>
            <CandidateRegisterForm locale="es" />
          </div>
        )}

        {/* CV Harvard */}
        {activeTab === "cv" && (
          <div>
            <CVHarvardConverter locale="es" />
          </div>
        )}

        {/* Jobs redirect */}
        {activeTab === "jobs" && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Ofertas de empleo</h2>
            <p className="text-gray-400 mb-8">
              Explora las ofertas laborales publicadas por empresas en nuestra plataforma.
            </p>
            <Link
              href="/jobs"
              className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition inline-block"
            >
              Ver todas las ofertas
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
