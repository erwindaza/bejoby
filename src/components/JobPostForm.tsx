// src/components/JobPostForm.tsx
"use client";

import { useState, FormEvent } from "react";

interface JobFormData {
  title: string;
  description: string;
  location: string;
  salary_range: string;
  employment_type: "full-time" | "part-time" | "contract" | "freelance";
  language: "es" | "en";
  status: "draft" | "published";
}

interface JobPostFormProps {
  employerId: string;
  onSuccess?: () => void;
}

export default function JobPostForm({ employerId, onSuccess }: JobPostFormProps) {
  const [form, setForm] = useState<JobFormData>({
    title: "",
    description: "",
    location: "",
    salary_range: "",
    employment_type: "full-time",
    language: "es",
    status: "published",
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
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, employer_id: employerId }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("success");
        setForm({
          title: "",
          description: "",
          location: "",
          salary_range: "",
          employment_type: "full-time",
          language: "es",
          status: "published",
        });
        onSuccess?.();
      } else {
        setErrorMsg(data.error || "Error al publicar");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Error de conexión");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Título del puesto *
        </label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
          placeholder="Ej: Desarrollador Full Stack Senior"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Descripción del cargo *
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={6}
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
          placeholder="Describe las responsabilidades, requisitos y beneficios del puesto..."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Ubicación</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            placeholder="Ej: Santiago, Chile / Remoto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Rango salarial
          </label>
          <input
            name="salary_range"
            value={form.salary_range}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            placeholder="Ej: $1.500.000 - $2.500.000 CLP"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de empleo</label>
          <select
            name="employment_type"
            value={form.employment_type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
          >
            <option value="full-time">Tiempo completo</option>
            <option value="part-time">Medio tiempo</option>
            <option value="contract">Contrato</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Idioma</label>
          <select
            name="language"
            value={form.language}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
          >
            <option value="published">Publicar ahora</option>
            <option value="draft">Guardar borrador</option>
          </select>
        </div>
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      {status === "success" && (
        <p className="text-green-400 text-sm">✅ Oferta publicada exitosamente</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Publicando..." : "Publicar oferta laboral"}
      </button>
    </form>
  );
}
