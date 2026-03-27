// src/components/Navbar.tsx — Clean job portal navigation
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const LOCALES = ["es", "en"] as const;
type Locale = (typeof LOCALES)[number];

function getLocale(pathname: string): Locale {
  return pathname.split("/")[1] === "en" ? "en" : "es";
}

const labels = {
  es: { findJobs: "Buscar Empleo", postJob: "Publicar Oferta" },
  en: { findJobs: "Find Jobs", postJob: "Post a Job" },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocale(pathname);
  const other: Locale = locale === "es" ? "en" : "es";
  const t = labels[locale];

  const switchLocale = useCallback(() => {
    const segs = pathname.split("/");
    if (LOCALES.includes(segs[1] as Locale)) segs[1] = other;
    else segs.splice(1, 0, other);
    router.push(segs.join("/") || "/");
  }, [pathname, other, router]);

  return (
    <header className="fixed top-0 left-0 w-full bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Image src="/logo.svg" alt="BeJoby" width={30} height={30} priority className="rounded-full" />
          <span className="text-xl font-bold text-white tracking-tight">BeJoby</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-5">
          <Link
            href={`/${locale}/jobs`}
            className="text-sm text-slate-300 hover:text-white transition"
          >
            {t.findJobs}
          </Link>
          <Link
            href={`/${locale}/post-job`}
            className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
          >
            {t.postJob}
          </Link>
          <button
            onClick={switchLocale}
            className="text-sm text-slate-400 hover:text-white transition"
            aria-label="Switch language"
          >
            {locale === "es" ? "🇺🇸 EN" : "🇪🇸 ES"}
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white text-2xl"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden border-t border-slate-700/50 bg-slate-900 px-4 py-4 space-y-3">
          <Link
            href={`/${locale}/jobs`}
            className="block text-slate-300 hover:text-white py-2"
            onClick={() => setOpen(false)}
          >
            {t.findJobs}
          </Link>
          <Link
            href={`/${locale}/post-job`}
            className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            onClick={() => setOpen(false)}
          >
            {t.postJob}
          </Link>
          <button
            onClick={() => {
              switchLocale();
              setOpen(false);
            }}
            className="block text-slate-400 hover:text-white py-2"
          >
            {locale === "es" ? "🇺🇸 English" : "🇪🇸 Español"}
          </button>
        </nav>
      )}
    </header>
  );
}
