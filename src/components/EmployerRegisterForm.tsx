// src/components/EmployerRegisterForm.tsx
"use client";

import { useState, FormEvent } from "react";
import ConsentCheckbox from "./ConsentCheckbox";

interface FormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  industry: string;
  consent_privacy: boolean;
}

const INDUSTRIES = [
  "Tecnología",
  "Finanzas",
  "Salud",
  "Educación",
  "Retail",
  "Manufactura",
  "Consultoría",
  "Marketing",
  "Logística",
  "Otro",
];

export default function EmployerRegisterForm() {
  const [form, setForm] = useState<FormData>({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    industry: "",
    consent_privacy: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.consent_privacy) {
      setErrorMsg("Debes aceptar la política de privacidad");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        localStorage.setItem("bejoby_employer_id", data.data.id);
      } else {
        setErrorMsg(data.error || "Error al registrar");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error de conexión");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-2">¡Registro exitoso!</h3>
        <p className="text-gray-400">
          Tu empresa ha sido registrada. Ahora puedes publicar ofertas laborales.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nombre de la empresa *
          </label>
          <input
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            placeholder="Ej: TechCorp"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Persona de contacto *
          </label>
          <input
            name="contact_name"
            value={form.contact_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            placeholder="Ej: María López"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            placeholder="contacto@empresa.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            placeholder="+56 9 1234 5678"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Sitio web</label>
          <input
            name="website"
            value={form.website}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            placeholder="https://empresa.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Industria</label>
          <select
            name="industry"
            value={form.industry}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
          >
            <option value="">Seleccionar...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Descripción de la empresa
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
          placeholder="Breve descripción de tu empresa..."
        />
      </div>

      <ConsentCheckbox
        id="employer_consent_privacy"
        checked={form.consent_privacy}
        onChange={(checked) => setForm({ ...form, consent_privacy: checked })}
        label="Acepto la"
        linkText="Política de Privacidad"
        linkHref="/es/legal/privacy"
        error={!form.consent_privacy && errorMsg.includes("privacidad") ? errorMsg : undefined}
      />

      {errorMsg && !errorMsg.includes("privacidad") && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Registrando..." : "Registrar empresa"}
      </button>
    </form>
  );
}
