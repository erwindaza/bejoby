// src/components/Navbar.tsx — Clean job portal navigation with auth
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const LOCALES = ["es", "en"] as const;
type Locale = (typeof LOCALES)[number];

function getLocale(pathname: string): Locale {
  return pathname.split("/")[1] === "en" ? "en" : "es";
}

const labels = {
  es: {
    findJobs: "Buscar Empleo",
    postJob: "Publicar Oferta",
    login: "Iniciar Sesión",
    myJobs: "Mis ofertas",
    dashboard: "Panel",
    logoutLabel: "Cerrar sesión",
  },
  en: {
    findJobs: "Find Jobs",
    postJob: "Post a Job",
    login: "Sign In",
    myJobs: "My jobs",
    dashboard: "Dashboard",
    logoutLabel: "Sign out",
  },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocale(pathname);
  const other: Locale = locale === "es" ? "en" : "es";
  const t = labels[locale];
  const { user, loading, openLogin, logout } = useAuth();

  const switchLocale = useCallback(() => {
    const segs = pathname.split("/");
    if (LOCALES.includes(segs[1] as Locale)) segs[1] = other;
    else segs.splice(1, 0, other);
    router.push(segs.join("/") || "/");
  }, [pathname, other, router]);

  // Close user menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setOpen(false);
    router.push(`/${locale}`);
  };

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

          {/* Auth: Login or User menu */}
          {!loading && !user && (
            <button
              onClick={openLogin}
              className="text-sm text-slate-300 hover:text-white transition"
            >
              {t.login}
            </button>
          )}
          {!loading && user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
              >
                <span className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.email[0].toUpperCase()}
                </span>
                <span className="hidden lg:inline max-w-[140px] truncate">{user.email}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-700">
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    href={`/${locale}/post-job`}
                    className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {t.postJob}
                  </Link>
                  {user.employer_id && (
                    <>
                      <Link
                        href={`/${locale}/employer/dashboard`}
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t.dashboard}
                      </Link>
                      <Link
                        href={`/${locale}/jobs?employer=${user.employer_id}`}
                        className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t.myJobs}
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition"
                  >
                    {t.logoutLabel}
                  </button>
                </div>
              )}
            </div>
          )}

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
          {!loading && !user && (
            <button
              onClick={() => { openLogin(); setOpen(false); }}
              className="block w-full text-left text-slate-300 hover:text-white py-2"
            >
              {t.login}
            </button>
          )}
          {!loading && user && (
            <>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                {user.email}
              </div>
              {user.employer_id && (
                <Link
                  href={`/${locale}/employer/dashboard`}
                  className="block text-slate-300 hover:text-white py-2"
                  onClick={() => setOpen(false)}
                >
                  {t.dashboard}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left text-red-400 hover:text-red-300 py-2"
              >
                {t.logoutLabel}
              </button>
            </>
          )}
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
