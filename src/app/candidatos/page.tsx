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
      {/* Hero Section */}
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
            <Link href="/contacto" className="btn-primary">
              Reserva Coaching
            </Link>
            <Link href="/cursos" className="btn-primary bg-white text-gray-800">
              Ver Cursos
            </Link>
          </div>
        </div>
      </section>

      {/* Qué ofrecemos */}
      <section className="section max-w-6xl mx-auto">
        <h2 className="section-title">Qué ofrecemos</h2>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="card">
            <h3 className="card-title">Revisión profesional de CV</h3>
            <p className="card-text">
              Ajustamos formato, palabras clave y logros cuantificados para que
              tu CV supere filtros ATS y atraiga reclutadores.
            </p>
          </div>

          <div className="card">
            <h3 className="card-title">Simulacros de entrevista</h3>
            <p className="card-text">
              Entrevistas grabadas y feedback accionable: técnica, comunicación
              y cultura.
            </p>
          </div>

          <div className="card">
            <h3 className="card-title">Plan de carrera</h3>
            <p className="card-text">
              Roadmap personalizado: habilidades, cursos recomendados y
              objetivos a 3/6/12 meses.
            </p>
          </div>
        </div>
      </section>

      {/* Beneficios rápidos */}
      <section className="section bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">¿Por qué elegir BeJoby?</h2>
          <ul className="grid md:grid-cols-3 gap-6 text-left">
            <li className="p-4 rounded-lg border bg-white dark:bg-gray-800">
              ✅ Mentoría personalizada con expertos en reclutamiento.
            </li>
            <li className="p-4 rounded-lg border bg-white dark:bg-gray-800">
              ✅ Acceso a plantillas y recursos exclusivos.
            </li>
            <li className="p-4 rounded-lg border bg-white dark:bg-gray-800">
              ✅ Entrenamiento 100% práctico y orientado a resultados.
            </li>
          </ul>
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Cómo trabajamos</h3>

          <ol className="space-y-6 text-left">
            <li className="p-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
              <strong className="block">1. Diagnóstico</strong>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Evaluamos tu CV y perfil para identificar tus fortalezas y
                áreas de mejora.
              </span>
            </li>

            <li className="p-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
              <strong className="block">2. Entrenamiento</strong>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Sesiones prácticas con feedback accionable en tiempo real.
              </span>
            </li>

            <li className="p-4 rounded-lg border border-gray-200 bg-white dark:bg-gray-800">
              <strong className="block">3. Entrevistas y seguimiento</strong>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Simulacros, ajustes finales y roadmap post-entrevista.
              </span>
            </li>
          </ol>
        </div>
      </section>

      {/* Testimonios */}
      <section className="section bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-8">Historias de éxito</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <blockquote className="p-6 rounded-lg shadow bg-white dark:bg-gray-800">
              <p className="italic">
                “Gracias a BeJoby logré mi primera oferta en tecnología. El
                simulacro de entrevistas fue clave.”
              </p>
              <footer className="mt-4 font-semibold">— Camila R.</footer>
            </blockquote>

            <blockquote className="p-6 rounded-lg shadow bg-white dark:bg-gray-800">
              <p className="italic">
                “Me ayudaron a rediseñar mi CV y a ganar confianza en mis
                entrevistas. ¡Hoy trabajo en una multinacional!”
              </p>
              <footer className="mt-4 font-semibold">— Andrés M.</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="section text-center">
        <h3 className="text-3xl font-bold mb-6">
          Da el siguiente paso en tu carrera 🚀
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          No te quedes atrás. Reserva tu sesión de coaching y comienza a
          construir tu futuro hoy mismo.
        </p>
        <Link href="/contacto" className="btn-primary">
          Reserva tu sesión ahora
        </Link>
      </section>
    </main>
  );
}
