import "./globals.css";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "BeJoby - Conectando talento",
  description:
    "Plataforma de coaching, empleabilidad y oportunidades laborales impulsada por inteligencia artificial.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)]">
        <Navbar />
        <main className="pt-20">{children}</main>
        <footer className="mt-20 py-10 bg-black text-gray-400 text-sm text-center">
          <p>
            © {new Date().getFullYear()} BeJoby — Impulsando tu futuro laboral
          </p>
        </footer>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
