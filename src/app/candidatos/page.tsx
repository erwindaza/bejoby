// src/app/candidatos/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Candidatos · BeJoby — Coaching y empleabilidad",
  description:
    "Servicios para candidatos: revisión de CV, simulaciones de entrevista y planes de carrera personalizados.",
};

export default function CandidatosPage() {
  return (
    <main className="min-h-screen pb-24">
      <section className="section pt-28 text-center bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Potencia tu carrera con coaching y herramientas prácticas
          </h1>
          <p className="text-lg mb-8 text-indigo-100/90">
            Sesiones personalizadas, revisión de CV real con plantillas y
            simulacros de entrevista para que llegues preparado a la oferta.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/candidatos#coaching" className="btn-primary">
              Reserva Coaching
            </Link>
            <Link href="/cursos" className="btn-primary bg-white text-gray-800">
              Ver Cursos
            </Link>
          </div>
        </div>
      </section>

      <section className="section max-w-6xl mx-auto">
        <h2 className="section-title">Qué ofrecemos</h2>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="card">
            <h3 className="card-title">Revisión profesional de CV</h3>
            <p className="card-text">
              Ajustamos formato, palabras clave y logros cuantificados para que tu CV supere ATS y atraiga reclutadores.
            </p>
          </div>

          <div className="card">
            <h3 className="card-title">Simulacros de entrevista</h3>
            <p className="card-text">
              Entrevistas grabadas y feedback accionable: técnica, comunicación y cultura.
            </p>
          </div>

          <div className="card">
            <h3 className="card-title">Plan de carrera</h3>
            <p className="card-text">
              Roadmap personalizado: habilidades, cursos recomendados y objetivos a 3/6/12 meses.
            </p>
          </div>
        </div>
      </section>

      <section className="section bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Cómo trabajamos</h3>

          <ol className="space-y-6 text-left">
            <li className="p-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
              <strong className="block">1. Diagnóstico</strong>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Evaluación rápida de CV y perfil para identificar oportunidades.
              </span>
            </li>

            <li className="p-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
              <strong className="block">2. Entrenamiento</strong>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Sesiones prácticas y tareas concretas (práctica, feedback).
              </span>
            </li>

            <li className="p-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
              <strong className="block">3. Entrevistas y seguimiento</strong>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Simulacros, ajustes finales y preparación para el proceso real.
              </span>
            </li>
          </ol>

          <div className="mt-8">
            <Link href="/contacto" className="btn-primary">
              Quiero una sesión
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
