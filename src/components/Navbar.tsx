// 📁 src/components/Navbar.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const LOCALES = ["es", "en"] as const;
type Locale = (typeof LOCALES)[number];

const NAV_LINKS: Record<Locale, { href: string; label: string }[]> = {
  es: [
    { href: "/jobs", label: "Ofertas" },
    { href: "/candidatos", label: "Candidatos" },
    { href: "/empresas", label: "Empresas" },
    { href: "/coaching", label: "Coaching" },
    { href: "/blog", label: "Blog" },
  ],
  en: [
    { href: "/jobs", label: "Job Board" },
    { href: "/candidatos", label: "Seekers" },
    { href: "/empresas", label: "Employers" },
    { href: "/coaching", label: "Coaching" },
    { href: "/blog", label: "Blog" },
  ],
};

function getLocaleFromPath(pathname: string): Locale {
  const seg = pathname.split("/")[1];
  if (seg === "en") return "en";
  return "es";
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPath(pathname);
  const otherLocale: Locale = locale === "es" ? "en" : "es";
  const links = NAV_LINKS[locale];

  const switchLocale = useCallback(() => {
    // Replace /es/... with /en/... or vice versa
    const segments = pathname.split("/");
    if (LOCALES.includes(segments[1] as Locale)) {
      segments[1] = otherLocale;
    } else {
      segments.splice(1, 0, otherLocale);
    }
    router.push(segments.join("/") || "/");
  }, [pathname, otherLocale, router]);

  const localizedHref = (href: string) => `/${locale}${href}`;

  return (
    <header className="fixed top-0 left-0 w-full bg-black/40 backdrop-blur-md border-b border-purple-800/20 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Image
            src="/logo.svg"
            alt="BeJoby Logo"
            width={38}
            height={38}
            priority
            className="rounded-full drop-shadow-sm"
          />
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
            BeJoby
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-200">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localizedHref(link.href)}
              className="relative group transition-colors duration-200"
            >
              <span className="group-hover:text-purple-400">{link.label}</span>
              <span className="absolute left-0 bottom-[-4px] w-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}

          {/* Language toggle */}
          <button
            onClick={switchLocale}
            className="ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/40 bg-purple-600/10 hover:bg-purple-600/25 text-xs font-bold text-purple-300 hover:text-white transition-all duration-200"
            aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <span className="text-base">{locale === "es" ? "🇺🇸" : "🇪🇸"}</span>
            {otherLocale.toUpperCase()}
          </button>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          {/* Mobile lang toggle */}
          <button
            onClick={switchLocale}
            className="flex items-center gap-1 px-2 py-1 rounded-full border border-purple-500/40 bg-purple-600/10 text-xs font-bold text-purple-300"
            aria-label={locale === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <span className="text-sm">{locale === "es" ? "🇺🇸" : "🇪🇸"}</span>
            {otherLocale.toUpperCase()}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white text-3xl focus:outline-none"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? "✖" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile fullscreen menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-gradient-to-b from-black via-purple-950/90 to-black flex flex-col items-center justify-center z-40">
          <nav className="flex flex-col items-center space-y-8 text-white text-2xl font-semibold">
            {links.map((link) => (
              <Link
                key={link.href}
                href={localizedHref(link.href)}
                className="hover:text-purple-400 transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

