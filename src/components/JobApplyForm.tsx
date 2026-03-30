// src/components/JobApplyForm.tsx
"use client";

import { useState, useRef, FormEvent } from "react";
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
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const t = locale === "es" ? {
    title: `Postular a: ${jobTitle}`,
    name: "Nombre completo",
    email: "Email",
    linkedin: "LinkedIn (opcional)",
    cv: "CV (PDF o DOCX)",
    cvHint: "Máximo 5 MB",
    cvSelected: "Archivo seleccionado:",
    cvChange: "Cambiar",
    cvRemove: "Quitar",
    message: "Carta de presentación / Mensaje",
    messagePlaceholder: "¿Por qué te interesa este puesto? Cuéntanos sobre tu experiencia...",
    submit: "Enviar postulación",
    submitting: "Enviando...",
    uploadingCV: "Subiendo CV...",
    success: "¡Postulación enviada!",
    successMsg: "Tu postulación ha sido recibida. La empresa revisará tu perfil.",
    consentShare: "Autorizo compartir mis datos (nombre, email, CV) con la empresa que publicó esta oferta",
    consentPrivacy: "He leído y acepto la",
    consentData: "Autorizo el tratamiento de mis datos personales para este proceso de selección",
    privacyLink: "Política de Privacidad",
    requiredConsents: "Debes aceptar todos los consentimientos para postular",
    invalidFile: "Solo se aceptan archivos PDF o DOCX (máximo 5 MB)",
  } : {
    title: `Apply to: ${jobTitle}`,
    name: "Full name",
    email: "Email",
    linkedin: "LinkedIn (optional)",
    cv: "Resume (PDF or DOCX)",
    cvHint: "Max 5 MB",
    cvSelected: "File selected:",
    cvChange: "Change",
    cvRemove: "Remove",
    message: "Cover letter / Message",
    messagePlaceholder: "Why are you interested in this role? Tell us about your experience...",
    submit: "Submit application",
    submitting: "Submitting...",
    uploadingCV: "Uploading resume...",
    success: "Application submitted!",
    successMsg: "Your application has been received. The company will review your profile.",
    consentShare: "I authorize sharing my data (name, email, CV) with the company that posted this job",
    consentPrivacy: "I have read and accept the",
    consentData: "I authorize the processing of my personal data for this selection process",
    privacyLink: "Privacy Policy",
    requiredConsents: "You must accept all consents to apply",
    invalidFile: "Only PDF and DOCX files accepted (max 5 MB)",
  };

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const MAX_SIZE = 5 * 1024 * 1024;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
      setErrorMsg(t.invalidFile);
      e.target.value = "";
      return;
    }
    setErrorMsg("");
    setCvFile(file);
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

      // Submit application first to get the ID
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
      if (!appData.ok) {
        setErrorMsg(appData.error || "Error");
        setStatus("error");
        return;
      }

      const applicationId = appData.data.id;

      // Upload CV if provided
      if (cvFile) {
        setUploadProgress(t.uploadingCV);
        const formData = new FormData();
        formData.append("file", cvFile);
        formData.append("application_id", applicationId);

        const uploadRes = await fetch("/api/cv/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (uploadData.ok) {
          // Update application with CV path
          await fetch(`/api/applications/${applicationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cv_path: uploadData.data.path,
              cv_filename: cvFile.name,
            }),
          });
        }
        setUploadProgress("");
      }

      setStatus("success");
      onSuccess?.();
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

      {/* CV Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t.cv}
          <span className="text-gray-500 font-normal ml-2">({t.cvHint})</span>
        </label>
        {!cvFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-6 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/80 transition"
          >
            <div className="text-3xl mb-2">📄</div>
            <p className="text-gray-400 text-sm">
              {locale === "es"
                ? "Haz clic para seleccionar tu CV"
                : "Click to select your resume"}
            </p>
            <p className="text-gray-500 text-xs mt-1">PDF, DOC, DOCX</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg">
            <span className="text-2xl">📎</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{cvFile.name}</p>
              <p className="text-gray-500 text-xs">{(cvFile.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => { setCvFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              {t.cvRemove}
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
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
      {uploadProgress && <p className="text-blue-400 text-sm">{uploadProgress}</p>}

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
