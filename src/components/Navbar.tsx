// 📁 src/components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/empresas", label: "Empresas" },
    { href: "/candidatos", label: "Candidatos" },
    { href: "/coaching", label: "Coaching" },
    { href: "/cursos", label: "Cursos" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full bg-black/40 backdrop-blur-md border-b border-purple-800/20 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* 🪩 Logo principal */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
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

        {/* 💻 Menú en desktop */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-200">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative group transition-colors duration-200"
            >
              <span className="group-hover:text-purple-400">{link.label}</span>
              <span className="absolute left-0 bottom-[-4px] w-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}
        </nav>

        {/* 📱 Botón hamburguesa móvil */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white text-3xl focus:outline-none"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* 📲 Menú móvil fullscreen */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-gradient-to-b from-black via-purple-950/90 to-black flex flex-col items-center justify-center z-40">
          <nav className="flex flex-col items-center space-y-8 text-white text-2xl font-semibold">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
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

