// src/components/JobListings.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import JobCard from "./JobCard";

interface Job {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: string;
  work_mode?: string;
  employer_id: string;
  employer_name?: string;
  company_display?: string;
  language: string;
  status: string;
  created_at: string;
  search_tags?: string[];
  stack?: Record<string, string[]>;
  seniority?: string;
  requirements_mandatory?: string[];
}

interface JobListingsProps {
  locale?: string;
}

export default function JobListings({ locale = "es" }: JobListingsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "published" });
      if (typeFilter) params.set("employment_type", typeFilter);
      if (modeFilter) params.set("work_mode", modeFilter);

      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      if (data.ok) {
        setJobs(data.data);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, modeFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /** Normalize text: lowercase + strip diacritics */
  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  /** Autocomplete suggestions from job titles */
  const suggestions = useMemo(() => {
    const q = normalize(search.trim());
    if (!q || q.length < 2) return [];
    return jobs
      .filter((job) => normalize(job.title).includes(q) || normalize(job.subtitle || "").includes(q))
      .slice(0, 5)
      .map((job) => ({
        id: job.id,
        title: job.title,
        company: job.company_display || job.employer_name || "",
      }));
  }, [search, jobs]);

  /** Build a single searchable string for a job */
  const buildSearchable = (job: Job): string => {
    const parts = [
      job.title,
      job.subtitle || "",
      job.description,
      job.location,
      job.seniority || "",
      ...(job.search_tags || []),
      ...(job.requirements_mandatory || []),
      ...Object.values(job.stack || {}).flat(),
    ];
    return normalize(parts.join(" "));
  };

  const filtered = jobs.filter((job) => {
    // Date filter
    if (dateFilter) {
      const created = typeof job.created_at === "object" && "_seconds" in job.created_at
        ? (job.created_at as unknown as { _seconds: number })._seconds * 1000
        : new Date(job.created_at).getTime();
      const now = Date.now();
      const diffDays = (now - created) / 86400000;
      if (dateFilter === "1" && diffDays > 1) return false;
      if (dateFilter === "7" && diffDays > 7) return false;
      if (dateFilter === "30" && diffDays > 30) return false;
    }
    // Text search
    if (!search.trim()) return true;
    const terms = normalize(search).split(/\s+/).filter(Boolean);
    const searchable = buildSearchable(job);
    return terms.every((term) => searchable.includes(term));
  });

  const noResultsMsg =
    locale === "es"
      ? "No encontramos ofertas para tu búsqueda. Prueba con otros términos o revisa todas las ofertas disponibles."
      : "No jobs found for your search. Try different terms or browse all available listings.";

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => { blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150); }}
            placeholder={locale === "es" ? "🔍 Buscar ofertas..." : "🔍 Search jobs..."}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  onMouseDown={() => { if (blurTimeout.current) clearTimeout(blurTimeout.current); }}
                  onClick={() => { setSearch(s.title); setShowSuggestions(false); }}
                  className="px-4 py-2.5 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-b-0"
                >
                  <span className="text-white text-sm">{s.title}</span>
                  {s.company && <span className="text-gray-500 text-xs ml-2">— {s.company}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 outline-none"
        >
          <option value="">{locale === "es" ? "Todos los tipos" : "All types"}</option>
          <option value="full-time">{locale === "es" ? "Tiempo completo" : "Full-time"}</option>
          <option value="part-time">{locale === "es" ? "Medio tiempo" : "Part-time"}</option>
          <option value="contract">{locale === "es" ? "Contrato" : "Contract"}</option>
          <option value="freelance">Freelance</option>
        </select>
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 outline-none"
        >
          <option value="">{locale === "es" ? "Todas las modalidades" : "All work modes"}</option>
          <option value="remote">{locale === "es" ? "100% Remoto" : "Remote"}</option>
          <option value="hybrid">{locale === "es" ? "Híbrido" : "Hybrid"}</option>
          <option value="on-site">{locale === "es" ? "Presencial" : "On-site"}</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 outline-none"
        >
          <option value="">{locale === "es" ? "Cualquier fecha" : "Any time"}</option>
          <option value="1">{locale === "es" ? "Últimas 24 horas" : "Last 24 hours"}</option>
          <option value="7">{locale === "es" ? "Última semana" : "Last week"}</option>
          <option value="30">{locale === "es" ? "Último mes" : "Last month"}</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-gray-400 mt-3">
            {locale === "es" ? "Cargando ofertas..." : "Loading jobs..."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-gray-400 max-w-md mx-auto">{noResultsMsg}</p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 underline"
            >
              {locale === "es" ? "Ver todas las ofertas" : "View all jobs"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              id={job.id}
              title={job.title}
              company_name={job.company_display || job.employer_name}
              description={job.description}
              location={job.location}
              salary_range={job.salary_range}
              employment_type={job.employment_type}
              work_mode={job.work_mode}
              created_at={job.created_at}
              locale={locale}
            />
          ))}
        </div>
      )}

      <p className="text-center text-gray-500 text-sm mt-6">
        {locale === "es"
          ? `${filtered.length} oferta${filtered.length !== 1 ? "s" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`
          : `${filtered.length} job${filtered.length !== 1 ? "s" : ""} found`}
      </p>
    </div>
  );
}
