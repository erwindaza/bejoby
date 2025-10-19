// 📁 src/components/Hero.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">

      {/* 🎥 Fondo en video animado */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-20"
      >
        <source src="/bg-office.webm" type="video/webm" />
        <source src="/bg-office.mp4" type="video/mp4" />
      </video>

      {/* 🖤 Capa oscura + brillo animado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-black/60 -z-10"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1.2 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 to-purple-600/40 blur-3xl -z-20"
      />

      {/* 🧠 Contenido principal */}
      <motion.h1
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-lg"
      >
        Conectando talento con oportunidades
      </motion.h1>

      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="max-w-2xl text-lg md:text-xl text-gray-200 mb-10"
      >
        BeJoby es tu plataforma de{" "}
        <span className="text-[var(--accent)] font-semibold">coaching</span>,{" "}
        <span className="text-[var(--primary)] font-semibold">empleabilidad</span> y{" "}
        <span className="text-[var(--secondary)] font-semibold">futuro laboral</span>.
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


