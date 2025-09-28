"use client";

import { useState } from "react";
import Link from "next/link";

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
    <header className="w-full bg-black/40 backdrop-blur-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
        >
          BeJoby
        </Link>

        {/* Menú en desktop */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-purple-400 transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Botón menú hamburguesa en móvil */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white text-2xl focus:outline-none"
        >
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Menú desplegable móvil */}
      {isOpen && (
        <div className="md:hidden bg-black/90 border-t border-gray-700">
          <nav className="flex flex-col items-center space-y-4 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg hover:text-purple-400 transition"
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
