// src/components/AnimatedLayout.tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function AnimatedLayout({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
