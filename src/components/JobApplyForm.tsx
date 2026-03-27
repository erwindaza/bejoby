// src/components/JobApplyForm.tsx
"use client";

import { useState, FormEvent } from "react";
import ConsentCheckbox from "./ConsentCheckbox";

interface JobApplyFormProps {
  jobId: string;
  jobTitle: string;
  locale?: string;
  onSuccess?: () => void;
}

export default function JobApplyForm({ jobId, jobTitle, locale = "es", onSuccess }: JobApplyFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    linkedin: "",
    consent_share_data: false,
    consent_privacy: false,
    consent_data_processing: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const t = locale === "es" ? {
    title: `Postular a: ${jobTitle}`,
    name: "Nombre completo",
    email: "Email",
    linkedin: "LinkedIn (opcional)",
    message: "Carta de presentación / Mensaje",
    messagePlaceholder: "¿Por qué te interesa este puesto? Cuéntanos sobre tu experiencia...",
    submit: "Enviar postulación",
    submitting: "Enviando...",
    success: "¡Postulación enviada!",
    successMsg: "Tu postulación ha sido recibida. La empresa revisará tu perfil.",
    consentShare: "Autorizo compartir mis datos (nombre, email, CV) con la empresa que publicó esta oferta",
    consentPrivacy: "He leído y acepto la",
    consentData: "Autorizo el tratamiento de mis datos personales para este proceso de selección",
    privacyLink: "Política de Privacidad",
    requiredConsents: "Debes aceptar todos los consentimientos para postular",
  } : {
    title: `Apply to: ${jobTitle}`,
    name: "Full name",
    email: "Email",
    linkedin: "LinkedIn (optional)",
    message: "Cover letter / Message",
    messagePlaceholder: "Why are you interested in this role? Tell us about your experience...",
    submit: "Submit application",
    submitting: "Submitting...",
    success: "Application submitted!",
    successMsg: "Your application has been received. The company will review your profile.",
    consentShare: "I authorize sharing my data (name, email, CV) with the company that posted this job",
    consentPrivacy: "I have read and accept the",
    consentData: "I authorize the processing of my personal data for this selection process",
    privacyLink: "Privacy Policy",
    requiredConsents: "You must accept all consents to apply",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.consent_share_data || !form.consent_privacy || !form.consent_data_processing) {
      setErrorMsg(t.requiredConsents);
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      // First register or find candidate
      let candidateId = localStorage.getItem("bejoby_candidate_id");

      if (!candidateId) {
        const regRes = await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            linkedin: form.linkedin,
            language: locale,
            consent_privacy: true,
            consent_data_processing: true,
          }),
        });
        const regData = await regRes.json();
        if (regData.ok) {
          candidateId = regData.data.id;
          localStorage.setItem("bejoby_candidate_id", candidateId!);
        } else if (regData.error?.includes("already exists") && regData.id) {
          candidateId = regData.id;
          localStorage.setItem("bejoby_candidate_id", candidateId!);
        } else {
          setErrorMsg(regData.error || "Error");
          setStatus("error");
          return;
        }
      }

      // Submit application  
      const appRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobId,
          candidate_id: candidateId,
          candidate_name: form.name,
          candidate_email: form.email,
          resume_url: form.linkedin || "",
          message: form.message,
          consent_share_data: true,
        }),
      });
      const appData = await appRes.json();
      if (appData.ok) {
        setStatus("success");
        onSuccess?.();
      } else {
        setErrorMsg(appData.error || "Error");
        setStatus("error");
      }
    } catch {
      setErrorMsg(locale === "es" ? "Error de conexión" : "Connection error");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-white mb-2">{t.success}</h3>
        <p className="text-gray-400">{t.successMsg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-xl font-bold text-white">{t.title}</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{t.name} *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{t.email} *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{t.linkedin}</label>
        <input
          name="linkedin"
          value={form.linkedin}
          onChange={handleChange}
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="https://linkedin.com/in/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{t.message}</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          placeholder={t.messagePlaceholder}
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-gray-700">
        <p className="text-sm font-medium text-gray-300 pt-3">
          {locale === "es" ? "Consentimientos requeridos:" : "Required consents:"}
        </p>
        <ConsentCheckbox
          id="apply_consent_share"
          checked={form.consent_share_data}
          onChange={(v) => setForm({ ...form, consent_share_data: v })}
          label={t.consentShare}
        />
        <ConsentCheckbox
          id="apply_consent_privacy"
          checked={form.consent_privacy}
          onChange={(v) => setForm({ ...form, consent_privacy: v })}
          label={t.consentPrivacy}
          linkText={t.privacyLink}
          linkHref={`/${locale}/legal/privacy`}
        />
        <ConsentCheckbox
          id="apply_consent_data"
          checked={form.consent_data_processing}
          onChange={(v) => setForm({ ...form, consent_data_processing: v })}
          label={t.consentData}
        />
      </div>

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? t.submitting : `📨 ${t.submit}`}
      </button>
    </form>
  );
}
