// src/components/SubscribeForm.tsx
"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "idle" | "loading" | "ok" | "err">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("ok");
        setEmail("");
      } else {
        setStatus("err");
      }
    } catch (err) {
      console.error("Subscribe error:", err);
      setStatus("err");
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-xl mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <button
          type="submit"
          className="btn-primary flex-shrink-0"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Enviando..." : "Suscribirme"}
        </button>
      </form>

      <div className="mt-3 text-center">
        {status === "ok" && <p className="text-sm text-green-500">¡Listo! Revisa tu bandeja.</p>}
        {status === "err" && <p className="text-sm text-red-500">Error. Intenta nuevamente.</p>}
      </div>
    </div>
  );
}

