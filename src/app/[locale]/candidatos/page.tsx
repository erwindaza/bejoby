"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CandidateRegisterForm from "@/components/CandidateRegisterForm";
import CVHarvardConverter from "@/components/CVHarvardConverter";

const texts = {
  es: {
    heroTitle: "Potencia tu carrera con coaching y herramientas prácticas",
    heroSub: "Regístrate, convierte tu CV al formato Harvard con IA y postula a las mejores ofertas laborales.",
    ctaRegister: "Registrarme",
    ctaCV: "Convertir mi CV",
    ctaJobs: "Ver ofertas de empleo",
    tabServices: "Servicios",
    tabRegister: "📝 Registrarme",
    tabCV: "📄 CV Harvard",
    tabJobs: "💼 Ofertas de empleo",
    whatWeOffer: "Qué ofrecemos",
    cvReview: "Revisión profesional de CV",
    cvReviewDesc: "Ajustamos formato, palabras clave y logros cuantificados para que tu CV supere filtros ATS y atraiga reclutadores.",
    interviews: "Simulacros de entrevista",
    interviewsDesc: "Entrevistas grabadas y feedback accionable: técnica, comunicación y cultura.",
    careerPlan: "Plan de carrera",
    careerPlanDesc: "Roadmap personalizado: habilidades, cursos recomendados y objetivos a 3/6/12 meses.",
    howWeWork: "Cómo trabajamos",
    step1: "1. Diagnóstico",
    step1Desc: "Evaluamos tu CV y perfil para identificar tus fortalezas y áreas de mejora.",
    step2: "2. Entrenamiento",
    step2Desc: "Sesiones prácticas con feedback accionable en tiempo real.",
    step3: "3. Entrevistas y seguimiento",
    step3Desc: "Simulacros, ajustes finales y roadmap post-entrevista.",
    stories: "Historias de éxito",
    quote1: "Gracias a BeJoby logré mi primera oferta en tecnología. El simulacro de entrevistas fue clave.",
    quote2: "Me ayudaron a rediseñar mi CV y a ganar confianza. ¡Hoy trabajo en una multinacional!",
    nextStep: "Da el siguiente paso en tu carrera",
    nextStepSub: "Regístrate, convierte tu CV con IA y postula a ofertas reales.",
    ctaGoCV: "Ir a CV Harvard",
    ctaRegisterNow: "Registrarme ahora",
    registerTitle: "Crea tu perfil de candidato",
    jobsTitle: "Ofertas de empleo",
    jobsSub: "Explora las ofertas laborales publicadas por empresas en nuestra plataforma.",
    viewAll: "Ver todas las ofertas",
  },
  en: {
    heroTitle: "Boost your career with coaching and practical tools",
    heroSub: "Sign up, convert your CV to Harvard format with AI, and apply to the best job listings.",
    ctaRegister: "Sign up",
    ctaCV: "Convert my CV",
    ctaJobs: "View job listings",
    tabServices: "Services",
    tabRegister: "📝 Sign up",
    tabCV: "📄 Harvard CV",
    tabJobs: "💼 Job listings",
    whatWeOffer: "What we offer",
    cvReview: "Professional CV review",
    cvReviewDesc: "We optimize format, keywords, and quantified achievements so your CV passes ATS filters and attracts recruiters.",
    interviews: "Mock interviews",
    interviewsDesc: "Recorded interviews with actionable feedback: technique, communication, and culture fit.",
    careerPlan: "Career plan",
    careerPlanDesc: "Personalized roadmap: skills, recommended courses, and goals at 3/6/12 months.",
    howWeWork: "How we work",
    step1: "1. Assessment",
    step1Desc: "We evaluate your CV and profile to identify strengths and areas for improvement.",
    step2: "2. Training",
    step2Desc: "Practical sessions with actionable feedback in real time.",
    step3: "3. Interviews & follow-up",
    step3Desc: "Mock interviews, final adjustments, and post-interview roadmap.",
    stories: "Success stories",
    quote1: "Thanks to BeJoby I landed my first tech job. The interview simulation was key.",
    quote2: "They helped me redesign my CV and gain confidence. Today I work at a multinational!",
    nextStep: "Take the next step in your career",
    nextStepSub: "Sign up, convert your CV with AI, and apply to real jobs.",
    ctaGoCV: "Go to Harvard CV",
    ctaRegisterNow: "Sign up now",
    registerTitle: "Create your candidate profile",
    jobsTitle: "Job listings",
    jobsSub: "Explore job listings posted by companies on our platform.",
    viewAll: "View all listings",
  },
};

export default function CandidatosPage() {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "en" ? "en" : "es";
  const t = texts[lang];

  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "register" | "cv" | "jobs">("info");

  useEffect(() => {
    const saved = localStorage.getItem("bejoby_candidate_id");
    if (saved) setCandidateId(saved);
  }, []);

  return (
    <main className="min-h-screen pb-24">
      {/* Hero */}
      <section className="pt-28 pb-16 text-center bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t.heroTitle}</h1>
          <p className="text-lg mb-8 text-indigo-100/90">{t.heroSub}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActiveTab(candidateId ? "cv" : "register")}
              className="px-6 py-3 bg-white text-purple-700 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              {candidateId ? t.ctaCV : t.ctaRegister}
            </button>
            <Link href={`/${locale}/jobs`} className="px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition">
              {t.ctaJobs}
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700 pb-3">
          <button onClick={() => setActiveTab("info")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "info" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
            {t.tabServices}
          </button>
          {!candidateId && (
            <button onClick={() => setActiveTab("register")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "register" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
              {t.tabRegister}
            </button>
          )}
          <button onClick={() => setActiveTab("cv")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "cv" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
            {t.tabCV}
          </button>
          <button onClick={() => setActiveTab("jobs")} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "jobs" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
            {t.tabJobs}
          </button>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        {activeTab === "info" && (
          <div className="space-y-16">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.whatWeOffer}</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <h3 className="text-white font-semibold mb-2">{t.cvReview}</h3>
                  <p className="text-gray-400 text-sm">{t.cvReviewDesc}</p>
                </div>
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <h3 className="text-white font-semibold mb-2">{t.interviews}</h3>
                  <p className="text-gray-400 text-sm">{t.interviewsDesc}</p>
                </div>
                <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <h3 className="text-white font-semibold mb-2">{t.careerPlan}</h3>
                  <p className="text-gray-400 text-sm">{t.careerPlanDesc}</p>
                </div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">{t.howWeWork}</h3>
              <ol className="space-y-4">
                <li className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <strong className="block text-white">{t.step1}</strong>
                  <span className="text-sm text-gray-400">{t.step1Desc}</span>
                </li>
                <li className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <strong className="block text-white">{t.step2}</strong>
                  <span className="text-sm text-gray-400">{t.step2Desc}</span>
                </li>
                <li className="p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                  <strong className="block text-white">{t.step3}</strong>
                  <span className="text-sm text-gray-400">{t.step3Desc}</span>
                </li>
              </ol>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-8">{t.stories}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <blockquote className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                  <p className="italic text-gray-300">&quot;{t.quote1}&quot;</p>
                  <footer className="mt-4 font-semibold text-purple-400">— Camila R.</footer>
                </blockquote>
                <blockquote className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                  <p className="italic text-gray-300">&quot;{t.quote2}&quot;</p>
                  <footer className="mt-4 font-semibold text-purple-400">— Andrés M.</footer>
                </blockquote>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">{t.nextStep}</h3>
              <p className="mb-6 text-gray-400">{t.nextStepSub}</p>
              <button onClick={() => setActiveTab(candidateId ? "cv" : "register")} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition">
                {candidateId ? t.ctaGoCV : t.ctaRegisterNow}
              </button>
            </div>
          </div>
        )}

        {activeTab === "register" && !candidateId && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{t.registerTitle}</h2>
            <CandidateRegisterForm locale={lang} />
          </div>
        )}

        {activeTab === "cv" && (
          <CVHarvardConverter locale={lang} />
        )}

        {activeTab === "jobs" && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">{t.jobsTitle}</h2>
            <p className="text-gray-400 mb-8">{t.jobsSub}</p>
            <Link href={`/${locale}/jobs`} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition inline-block">
              {t.viewAll}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
