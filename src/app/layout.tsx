// 📁 app/layout.tsx
// ✅ Archivo raíz de layout global en Next.js (App Router).
// Se encarga de inyectar el <html>, <body>, metadatos globales, navbar, footer y scripts de analítica.

import "./globals.css"; // 📄 Archivo de estilos globales → ubicado en app/globals.css
import type { Metadata } from "next"; // 📦 Tipado de metadatos para Next.js
import Navbar from "../components/Navbar"; // 📁 Componente de la barra superior → src/components/Navbar.tsx
import { SpeedInsights } from "@vercel/speed-insights/next"; // 📊 Módulo de Vercel para medir rendimiento
import { Analytics } from "@vercel/analytics/react"; // 📈 Analítica automática de Vercel

// 🧠 Metadatos globales de BeJoby
export const metadata: Metadata = {
  title: "BeJoby - Conectando talento",
  description:
    "Plataforma de coaching, empleabilidad y oportunidades laborales impulsada por inteligencia artificial.",
  icons: {
    // 📍 Icono del sitio (favicon)
    // ⚠️ El favicon debe estar en la carpeta /public/
    // 📄 Ruta real: /public/favicon.ico
    // 🔄 Reemplaza "/logo.png" por "/favicon.ico" para mostrar correctamente el ícono del navegador
    icon: "/favicon.ico",
  },
};

// 🌎 Layout raíz que envuelve todas las páginas (app/page.tsx, app/empresas/page.tsx, etc.)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        {/* 🌐 Navbar global (arriba de todo) */}
        <Navbar />

        {/* 📦 Contenido principal dinámico (según la ruta) */}
        <main className="pt-20">{children}</main>

        {/* 📍 Footer global con copyright */}
        <footer className="mt-20 py-10 bg-black text-gray-400 text-sm text-center">
          <p>
            © {new Date().getFullYear()} BeJoby — Impulsando tu futuro laboral
          </p>
        </footer>

        {/* ⚡ Módulos de medición y analítica de Vercel */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
