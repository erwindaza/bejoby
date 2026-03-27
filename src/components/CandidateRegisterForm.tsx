// src/components/CandidateRegisterForm.tsx
"use client";

import { useState, FormEvent } from "react";
import ConsentCheckbox from "./ConsentCheckbox";

interface FormData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  language: "es" | "en";
  consent_privacy: boolean;
  consent_data_processing: boolean;
}

export default function CandidateRegisterForm({ locale = "es" }: { locale?: string }) {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    language: locale === "en" ? "en" : "es",
    consent_privacy: false,
    consent_data_processing: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.consent_privacy || !form.consent_data_processing) {
      setErrorMsg(
        locale === "es"
          ? "Debes aceptar todos los consentimientos para continuar"
          : "You must accept all consents to continue"
      );
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        localStorage.setItem("bejoby_candidate_id", data.data.id);
      } else {
        setErrorMsg(data.error || (locale === "es" ? "Error al registrar" : "Registration error"));
        setStatus("error");
      }
    } catch {
      setErrorMsg(locale === "es" ? "Error de conexión" : "Connection error");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {locale === "es" ? "¡Registro exitoso!" : "Registration successful!"}
        </h3>
        <p className="text-gray-400">
          {locale === "es"
            ? "Ya puedes postular a ofertas laborales y usar nuestro generador de CV Harvard."
            : "You can now apply to jobs and use our Harvard CV generator."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {locale === "es" ? "Nombre completo *" : "Full name *"}
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder={locale === "es" ? "Ej: Juan Pérez" : "e.g. John Smith"}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {locale === "es" ? "Teléfono" : "Phone"}
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="+56 9 1234 5678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">LinkedIn</label>
          <input
            name="linkedin"
            value={form.linkedin}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="https://linkedin.com/in/tu-perfil"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <ConsentCheckbox
          id="candidate_consent_privacy"
          checked={form.consent_privacy}
          onChange={(checked) => setForm({ ...form, consent_privacy: checked })}
          label={locale === "es" ? "He leído y acepto la" : "I have read and accept the"}
          linkText={locale === "es" ? "Política de Privacidad" : "Privacy Policy"}
          linkHref={`/${locale}/legal/privacy`}
        />
        <ConsentCheckbox
          id="candidate_consent_data"
          checked={form.consent_data_processing}
          onChange={(checked) => setForm({ ...form, consent_data_processing: checked })}
          label={
            locale === "es"
              ? "Autorizo el tratamiento de mis datos personales para fines de búsqueda de empleo y coaching laboral"
              : "I authorize the processing of my personal data for job search and career coaching purposes"
          }
        />
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading"
          ? locale === "es" ? "Registrando..." : "Registering..."
          : locale === "es" ? "Registrarme como candidato" : "Register as candidate"}
      </button>
    </form>
  );
}
