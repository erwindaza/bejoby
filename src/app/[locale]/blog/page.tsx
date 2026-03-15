// src/app/blog/page.tsx
import SubscribeForm from "@/components/SubscribeForm";
import Link from "next/link";

export const metadata = {
  title: "Blog · BeJoby — Empleo, CV y entrevistas",
  description:
    "Artículos prácticos sobre empleo, búsqueda laboral, CV, entrevistas y desarrollo profesional.",
};

type Post = {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  date: string;
  href?: string;
};

const POSTS: Post[] = [
  {
    id: "1",
    title: "Cómo escribir un CV que consiga entrevistas",
    excerpt:
      "Guía paso a paso con plantilla práctica, palabras clave y errores a evitar.",
    tag: "CV",
    date: "2025-08-01",
  },
  {
    id: "2",
    title: "Preparación para entrevistas técnicas y de cultura",
    excerpt:
      "Método STAR, preguntas típicas y cómo destacar tu impacto real en proyectos.",
    tag: "Entrevistas",
    date: "2025-07-18",
  },
  {
    id: "3",
    title: "Optimiza tu perfil LinkedIn para reclutadores",
    excerpt:
      "Títulos, extractos y ejemplos que aumentan el contacto con empresas.",
    tag: "LinkedIn",
    date: "2025-07-05",
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen pb-24">
      {/* HERO */}
      <section className="section bg-gradient-to-r from-indigo-600 to-purple-600 text-white pt-28">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Blog BeJoby — Recursos para tu carrera
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-indigo-100/80">
            Artículos prácticos y guías para mejorar tu CV, prepararte para
            entrevistas y acelerar tu empleabilidad.
          </p>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="section max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Últimos artículos</h2>
          <Link href="/blog" className="text-sm text-[var(--primary)] hover:underline">
            Ver todo
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {POSTS.map((post) => (
            <article
              key={post.id}
              className="card hover:scale-[1.02] transition-transform duration-200 flex flex-col"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm px-3 py-1 rounded-full bg-white/10 text-white/90">
                  {post.tag}
                </span>
                <time className="text-xs text-gray-200">{post.date}</time>
              </div>

              <h3 className="card-title text-lg mb-2 text-white">{post.title}</h3>
              <p className="card-text text-sm mb-4 text-white/80">{post.excerpt}</p>

              <div className="mt-auto">
                <Link
                  href={post.href ?? "#"}
                  className="inline-block px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:opacity-90"
                >
                  Leer artículo →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* NEWSLETTER / SUBSCRIBE (Client Component) */}
      <section className="section bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">¿Quieres más contenido?</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Suscríbete a nuestro newsletter y recibe guías concretas cada mes.
          </p>

          {/* Aquí usamos el Client Component con onSubmit */}
          <SubscribeForm />
        </div>
      </section>
    </main>
  );
}
