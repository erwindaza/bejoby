"use client";

import { useParams } from "next/navigation";
import JobListings from "@/components/JobListings";

const texts = {
  es: {
    title: "Ofertas de Empleo",
    subtitle: "Encuentra tu próxima oportunidad laboral. Busca por título, ubicación o tipo de contrato.",
  },
  en: {
    title: "Job Board",
    subtitle: "Find your next career opportunity. Search by title, location, or contract type.",
  },
};

export default function JobsPage() {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "en" ? "en" : "es";
  const t = texts[lang];

  return (
    <main className="min-h-screen pb-24">
      <section className="pt-28 pb-12 text-center bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t.title}</h1>
          <p className="text-lg text-indigo-100/90">{t.subtitle}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <JobListings locale={lang} />
      </section>
    </main>
  );
}
