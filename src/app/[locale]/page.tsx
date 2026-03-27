// src/app/[locale]/page.tsx — Indeed-style homepage
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import JobCard from "@/components/JobCard";

const t = {
  es: {
    heroTitle: "Encuentra tu próximo empleo",
    heroSub: "Ofertas laborales reales publicadas por empresas. Busca, postula y trabaja.",
    searchPlaceholder: "Buscar por cargo, empresa o ubicación...",
    searchBtn: "Buscar",
    recentJobs: "Ofertas recientes",
    viewAll: "Ver todas las ofertas →",
    noJobs: "Pronto habrá ofertas disponibles. ¡Sé el primero en publicar!",
    postJobCTA: "Publicar oferta gratis",
    howTitle: "Cómo funciona",
    step1: "Busca",
    step1d: "Explora ofertas por cargo, ubicación o tipo de contrato.",
    step2: "Postula",
    step2d: "Envía tu postulación directo a la empresa.",
    step3: "Trabaja",
    step3d: "Conecta con empresas y comienza tu nuevo empleo.",
    empTitle: "¿Buscas talento?",
    empSub: "Publica tu oferta en minutos y recibe postulaciones de candidatos calificados.",
    empBtn: "Publicar una oferta",
  },
  en: {
    heroTitle: "Find your next job",
    heroSub: "Real job listings posted by companies. Search, apply, and work.",
    searchPlaceholder: "Search by title, company, or location...",
    searchBtn: "Search",
    recentJobs: "Recent jobs",
    viewAll: "View all jobs →",
    noJobs: "Jobs coming soon. Be the first to post!",
    postJobCTA: "Post a job for free",
    howTitle: "How it works",
    step1: "Search",
    step1d: "Browse jobs by title, location, or contract type.",
    step2: "Apply",
    step2d: "Send your application directly to the company.",
    step3: "Work",
    step3d: "Connect with companies and start your new job.",
    empTitle: "Looking for talent?",
    empSub: "Post your job in minutes and receive applications from qualified candidates.",
    empBtn: "Post a job",
  },
};

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: string;
  work_mode?: string;
  employer_name?: string;
  created_at: string;
}

export default function HomePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const lang = locale === "en" ? "en" : "es";
  const l = t[lang];
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?status=published");
      const data = await res.json();
      if (data.ok) setJobs(data.data.slice(0, 6));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view", page: "home" }),
    }).catch(() => {});
  }, [fetchJobs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      search.trim()
        ? `/${locale}/jobs?q=${encodeURIComponent(search.trim())}`
        : `/${locale}/jobs`
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero + Search */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-blue-950/60 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{l.heroTitle}</h1>
          <p className="text-lg text-slate-400 mb-8">{l.heroSub}</p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={l.searchPlaceholder}
              className="flex-1 px-5 py-3.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
            >
              {l.searchBtn}
            </button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8">{l.howTitle}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: l.step1, desc: l.step1d },
            { icon: "📨", title: l.step2, desc: l.step2d },
            { icon: "🎯", title: l.step3, desc: l.step3d },
          ].map((s) => (
            <div key={s.title} className="text-center p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="text-white font-semibold mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent jobs */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">{l.recentJobs}</h2>
          <Link href={`/${locale}/jobs`} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            {l.viewAll}
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 border border-slate-700 rounded-xl">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-slate-400 mb-4">{l.noJobs}</p>
            <Link
              href={`/${locale}/post-job`}
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
            >
              {l.postJobCTA}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                title={job.title}
                company_name={job.employer_name}
                description={job.description}
                location={job.location}
                salary_range={job.salary_range}
                employment_type={job.employment_type}
                work_mode={job.work_mode}
                created_at={job.created_at}
                locale={lang}
              />
            ))}
          </div>
        )}
      </section>

      {/* Employer CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">{l.empTitle}</h2>
        <p className="text-slate-400 mb-6">{l.empSub}</p>
        <Link
          href={`/${locale}/post-job`}
          className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
        >
          {l.empBtn}
        </Link>
      </section>
    </div>
  );
}
