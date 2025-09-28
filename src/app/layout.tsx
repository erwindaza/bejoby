import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "BeJoby - Conectando talento",
  description: "Plataforma de coaching, empleabilidad y oportunidades laborales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        {/* 🌐 Navbar */}
        <header className="navbar bg-black/40 backdrop-blur-md">
          <Link
            href="/"
            className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
          >
            BeJoby
          </Link>
          <nav className="flex space-x-8 text-sm font-medium">
            <Link href="/empresas">Empresas</Link>
            <Link href="/candidatos">Candidatos</Link>
            <Link href="/coaching">Coaching</Link>
            <Link href="/cursos">Cursos</Link>
            <Link href="/blog">Blog</Link>
          </nav>
        </header>

        {/* 📦 Aquí se carga cada página */}
        <main className="pt-20">{children}</main>

        {/* 📍 Footer */}
        <footer className="mt-20 py-10 bg-black text-gray-400 text-sm text-center">
          <p>© {new Date().getFullYear()} BeJoby — Impulsando tu futuro laboral</p>
        </footer>
      </body>
    </html>
  );
}

