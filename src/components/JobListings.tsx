// src/components/JobListings.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import JobCard from "./JobCard";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: string;
  employer_id: string;
  employer_name?: string;
  language: string;
  status: string;
  created_at: string;
}

interface JobListingsProps {
  locale?: string;
}

export default function JobListings({ locale = "es" }: JobListingsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "published" });
      if (typeFilter) params.set("employment_type", typeFilter);

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
  }, [typeFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filtered = jobs.filter((job) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === "es" ? "🔍 Buscar ofertas..." : "🔍 Search jobs..."}
          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
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
          <p className="text-gray-400">
            {locale === "es"
              ? "No se encontraron ofertas laborales."
              : "No job listings found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              id={job.id}
              title={job.title}
              company_name={job.employer_name}
              description={job.description}
              location={job.location}
              salary_range={job.salary_range}
              employment_type={job.employment_type}
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
