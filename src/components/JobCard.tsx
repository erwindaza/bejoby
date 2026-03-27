// src/components/JobCard.tsx
"use client";

import Link from "next/link";

interface JobCardProps {
  id: string;
  title: string;
  company_name?: string;
  location: string;
  salary_range: string;
  employment_type: string;
  work_mode?: string;
  description: string;
  created_at: string;
  locale?: string;
}

const typeLabels: Record<string, Record<string, string>> = {
  es: {
    "full-time": "Tiempo completo",
    "part-time": "Medio tiempo",
    contract: "Contrato",
    freelance: "Freelance",
  },
  en: {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    freelance: "Freelance",
  },
};

const workModeLabels: Record<string, Record<string, string>> = {
  es: { remote: "Remoto", hybrid: "Híbrido", "on-site": "Presencial" },
  en: { remote: "Remote", hybrid: "Hybrid", "on-site": "On-site" },
};

export default function JobCard({
  id,
  title,
  company_name,
  location,
  salary_range,
  employment_type,
  work_mode,
  description,
  created_at,
  locale = "es",
}: JobCardProps) {
  const typeLabel = typeLabels[locale]?.[employment_type] || employment_type;
  const modeLabel = work_mode ? (workModeLabels[locale]?.[work_mode] || work_mode) : null;
  const date = created_at
    ? new Date(created_at).toLocaleDateString(locale === "es" ? "es-CL" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-blue-500/50 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
            {title}
          </h3>
          {company_name && (
            <p className="text-sm text-blue-400">{company_name}</p>
          )}
        </div>
        <span className="px-3 py-1 bg-blue-600/20 text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
          {typeLabel}
        </span>
        {modeLabel && (
        <span className="px-3 py-1 bg-emerald-600/20 text-emerald-300 text-xs font-medium rounded-full whitespace-nowrap">
          {modeLabel}
        </span>
        )}
      </div>

      <p className="text-gray-400 text-sm line-clamp-2 mb-4">
        {description}
      </p>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        {location && (
          <span className="flex items-center gap-1">📍 {location}</span>
        )}
        {salary_range && (
          <span className="flex items-center gap-1">💰 {salary_range}</span>
        )}
        {date && (
          <span className="flex items-center gap-1">📅 {date}</span>
        )}
      </div>

      <Link
        href={`/${locale}/jobs/${id}`}
        className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all"
      >
        {locale === "es" ? "Ver oferta" : "View job"}
      </Link>
    </div>
  );
}
