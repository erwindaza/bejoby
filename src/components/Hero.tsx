"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Glow animado de fondo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1.2 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 blur-3xl -z-10"
      />

      <motion.h1
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent"
      >
        Conectando talento con oportunidades
      </motion.h1>

      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10"
      >
        BeJoby es tu plataforma de{" "}
        <span className="text-[var(--accent)]">coaching</span>,{" "}
        <span className="text-[var(--primary)]">empleabilidad</span> y{" "}
        <span className="text-[var(--secondary)]">futuro laboral</span>.
      </motion.p>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <Link href="/candidatos" className="btn-primary shadow-2xl">
          🚀 Empieza Ahora
        </Link>
      </motion.div>
    </section>
  );
}
