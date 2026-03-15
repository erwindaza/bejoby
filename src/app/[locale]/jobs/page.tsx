"use client";

import JobListings from "@/components/JobListings";

export default function JobsPage() {
  return (
    <main className="min-h-screen pb-24">
      {/* Hero */}
      <section className="pt-28 pb-12 text-center bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Ofertas de Empleo
          </h1>
          <p className="text-lg text-indigo-100/90">
            Encuentra tu próxima oportunidad laboral. Busca por título, ubicación o tipo de contrato.
          </p>
        </div>
      </section>

      {/* Job Listings */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <JobListings locale="es" />
      </section>
    </main>
  );
}
