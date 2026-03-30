import "./globals.css";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../components/AuthProvider";
import LoginModal from "../components/LoginModal";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "BeJoby — Portal de Empleo",
  description:
    "Busca empleo, postula a ofertas laborales y conecta con empresas. Publica vacantes gratis.",
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
        <AuthProvider>
          <Navbar />
          <LoginModal />
          <main className="pt-14">{children}</main>
          <footer className="mt-16 py-8 border-t border-slate-800 text-slate-500 text-sm text-center">
            <p>© {new Date().getFullYear()} BeJoby</p>
          </footer>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
