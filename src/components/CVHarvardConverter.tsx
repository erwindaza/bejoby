// src/components/CVHarvardConverter.tsx
"use client";

import { useState } from "react";

interface CVHarvardConverterProps {
  locale?: string;
}

export default function CVHarvardConverter({ locale = "es" }: CVHarvardConverterProps) {
  const [cvText, setCvText] = useState("");
  const [harvardCV, setHarvardCV] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const t = locale === "es" ? {
    title: "Generador de CV Formato Harvard",
    subtitle: "Pega tu CV actual y lo transformaremos al formato Harvard profesional usando IA.",
    placeholder: "Pega aquí el texto de tu CV actual...\n\nIncluye tu información personal, experiencia laboral, educación, habilidades, etc.",
    minChars: "Mínimo 50 caracteres",
    generate: "Generar CV Harvard",
    generating: "Generando con IA...",
    result: "Tu CV en Formato Harvard",
    copy: "Copiar al portapapeles",
    copied: "¡Copiado!",
    reset: "Generar otro",
    tip: "💡 Tip: Mientras más detallado sea tu CV original, mejor será el resultado.",
    legal: "Tu CV es procesado de forma segura y no se almacena permanentemente. Solo se usa para generar el formato Harvard.",
  } : {
    title: "Harvard Format CV Generator",
    subtitle: "Paste your current CV and we'll transform it to professional Harvard format using AI.",
    placeholder: "Paste your current CV text here...\n\nInclude your personal information, work experience, education, skills, etc.",
    minChars: "Minimum 50 characters",
    generate: "Generate Harvard CV",
    generating: "Generating with AI...",
    result: "Your CV in Harvard Format",
    copy: "Copy to clipboard",
    copied: "Copied!",
    reset: "Generate another",
    tip: "💡 Tip: The more detailed your original CV, the better the result.",
    legal: "Your CV is processed securely and not stored permanently. It is only used to generate the Harvard format.",
  };

  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (cvText.trim().length < 50) {
      setErrorMsg(t.minChars);
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/cv/harvard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_text: cvText, language: locale }),
      });
      const data = await res.json();
      if (data.ok) {
        setHarvardCV(data.data.harvard_cv);
        setStatus("done");
      } else {
        setErrorMsg(data.error || "Error");
        setStatus("error");
      }
    } catch {
      setErrorMsg(locale === "es" ? "Error de conexión" : "Connection error");
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(harvardCV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setHarvardCV("");
    setStatus("idle");
    setCvText("");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">📄 {t.title}</h2>
        <p className="text-gray-400">{t.subtitle}</p>
      </div>

      {status !== "done" ? (
        <div className="space-y-4">
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
            placeholder={t.placeholder}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {cvText.length} / 50,000 {locale === "es" ? "caracteres" : "characters"}
            </span>
            <p className="text-xs text-gray-500">{t.tip}</p>
          </div>

          {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

          <button
            onClick={handleGenerate}
            disabled={status === "loading"}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                {t.generating}
              </>
            ) : (
              <>🚀 {t.generate}</>
            )}
          </button>

          <p className="text-xs text-gray-600 text-center">🔒 {t.legal}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-green-400">✅ {t.result}</h3>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 font-mono text-sm text-gray-200 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
            {harvardCV}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all"
            >
              {copied ? `✅ ${t.copied}` : `📋 ${t.copy}`}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all"
            >
              🔄 {t.reset}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
