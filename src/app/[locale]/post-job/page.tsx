// src/app/[locale]/post-job/page.tsx — Employer registration + job posting in one flow
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ConsentCheckbox from "@/components/ConsentCheckbox";

const t = {
  es: {
    heroTitle: "Publica una oferta de empleo",
    heroSub: "En 2 pasos: registra tu empresa y publica tu vacante. Gratis.",
    step1: "1. Tu empresa",
    step2: "2. Tu oferta",
    // Employer form
    companyName: "Nombre de la empresa *",
    contactName: "Persona de contacto *",
    email: "Email corporativo *",
    phone: "Teléfono",
    website: "Sitio web",
    industry: "Industria",
    selectIndustry: "Seleccionar...",
    consent: "Acepto la",
    privacyLink: "Política de Privacidad",
    consentRequired: "Debes aceptar la política de privacidad",
    registerBtn: "Continuar",
    registering: "Registrando...",
    // Job form
    jobTitle: "Título del puesto *",
    jobTitlePh: "Ej: Desarrollador Full Stack Senior",
    jobDesc: "Descripción del cargo *",
    jobDescPh: "Responsabilidades, requisitos y beneficios del puesto...",
    location: "Ubicación",
    locationPh: "Ej: Santiago, Chile / Remoto",
    salary: "Rango salarial",
    salaryPh: "Ej: $1.500.000 - $2.500.000 CLP",
    type: "Tipo de empleo",
    typeFullTime: "Tiempo completo",
    typePartTime: "Medio tiempo",
    typeContract: "Contrato",
    typeFreelance: "Freelance",
    workMode: "Modalidad",
    modeRemote: "100% Remoto",
    modeHybrid: "Híbrido",
    modeOnSite: "Presencial",
    language: "Idioma de la oferta",
    publishBtn: "Publicar oferta",
    publishing: "Publicando...",
    // Success
    successTitle: "¡Oferta publicada!",
    successSub: "Tu oferta ya es visible para los candidatos.",
    postAnother: "Publicar otra oferta",
    viewJobs: "Ver ofertas",
    // Errors
    connectionError: "Error de conexión. Intenta de nuevo.",
  },
  en: {
    heroTitle: "Post a job listing",
    heroSub: "2 steps: register your company and post your job. Free.",
    step1: "1. Your company",
    step2: "2. Your job",
    companyName: "Company name *",
    contactName: "Contact person *",
    email: "Corporate email *",
    phone: "Phone",
    website: "Website",
    industry: "Industry",
    selectIndustry: "Select...",
    consent: "I accept the",
    privacyLink: "Privacy Policy",
    consentRequired: "You must accept the privacy policy",
    registerBtn: "Continue",
    registering: "Registering...",
    jobTitle: "Job title *",
    jobTitlePh: "e.g. Senior Full Stack Developer",
    jobDesc: "Job description *",
    jobDescPh: "Responsibilities, requirements, and benefits...",
    location: "Location",
    locationPh: "e.g. New York / Remote",
    salary: "Salary range",
    salaryPh: "e.g. $80,000 - $120,000 USD",
    type: "Employment type",
    typeFullTime: "Full-time",
    typePartTime: "Part-time",
    typeContract: "Contract",
    typeFreelance: "Freelance",
    workMode: "Work mode",
    modeRemote: "Remote",
    modeHybrid: "Hybrid",
    modeOnSite: "On-site",
    language: "Job language",
    publishBtn: "Publish job",
    publishing: "Publishing...",
    successTitle: "Job published!",
    successSub: "Your listing is now visible to candidates.",
    postAnother: "Post another job",
    viewJobs: "View jobs",
    connectionError: "Connection error. Please try again.",
  },
};

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Consulting", "Marketing", "Logistics", "Other",
];

function StepBadge({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
      done ? "bg-green-600/20 text-green-400" : active ? "bg-blue-600/20 text-blue-400" : "bg-slate-800 text-slate-500"
    }`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        done ? "bg-green-600 text-white" : active ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"
      }`}>
        {done ? "✓" : num}
      </span>
      {label}
    </div>
  );
}

export default function PostJobPage() {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "en" ? "en" : "es";
  const l = t[lang];

  const [step, setStep] = useState<"register" | "post" | "success">("register");
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Employer form
  const [emp, setEmp] = useState({
    company_name: "", contact_name: "", email: "", phone: "",
    website: "", industry: "", consent_privacy: false,
  });

  // Job form
  const [job, setJob] = useState({
    title: "", description: "", location: "", salary_range: "",
    employment_type: "full-time", work_mode: "on-site", language: lang, status: "published" as const,
  });

  useEffect(() => {
    const saved = localStorage.getItem("bejoby_employer_id");
    if (saved) { setEmployerId(saved); setStep("post"); }
  }, []);

  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view", page: "post-job" }),
    }).catch(() => {});
  }, []);

  const handleEmpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEmp({ ...emp, [e.target.name]: e.target.value });
  };

  const handleJobChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const submitEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emp.consent_privacy) { setErrorMsg(l.consentRequired); return; }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emp),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("bejoby_employer_id", data.data.id);
        setEmployerId(data.data.id);
        setStep("post");
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "employer_registered", metadata: { id: data.data.id } }),
        }).catch(() => {});
      } else {
        setErrorMsg(data.error || "Error");
      }
    } catch {
      setErrorMsg(l.connectionError);
    } finally {
      setLoading(false);
    }
  };

  const submitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...job, employer_id: employerId }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep("success");
        setJob({ title: "", description: "", location: "", salary_range: "", employment_type: "full-time", work_mode: "on-site", language: lang, status: "published" });
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "job_posted", metadata: { id: data.data.id } }),
        }).catch(() => {});
      } else {
        setErrorMsg(data.error || "Error");
      }
    } catch {
      setErrorMsg(l.connectionError);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

  return (
    <main className="min-h-screen pb-24">
      {/* Hero */}
      <section className="pt-24 pb-10 text-center px-4 bg-gradient-to-b from-blue-950/60 to-transparent">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{l.heroTitle}</h1>
        <p className="text-slate-400 mb-6">{l.heroSub}</p>
        <div className="flex justify-center gap-4">
          <StepBadge num={1} label={l.step1} active={step === "register"} done={!!employerId} />
          <StepBadge num={2} label={l.step2} active={step === "post"} done={step === "success"} />
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 py-8">
        {/* Step 1: Employer registration */}
        {step === "register" && !employerId && (
          <form onSubmit={submitEmployer} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.companyName}</label>
                <input name="company_name" required value={emp.company_name} onChange={handleEmpChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.contactName}</label>
                <input name="contact_name" required value={emp.contact_name} onChange={handleEmpChange} className={inputCls} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.email}</label>
                <input name="email" type="email" required value={emp.email} onChange={handleEmpChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.phone}</label>
                <input name="phone" value={emp.phone} onChange={handleEmpChange} className={inputCls} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.website}</label>
                <input name="website" value={emp.website} onChange={handleEmpChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.industry}</label>
                <select name="industry" value={emp.industry} onChange={handleEmpChange} className={inputCls}>
                  <option value="">{l.selectIndustry}</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <ConsentCheckbox
              id="emp_consent"
              checked={emp.consent_privacy}
              onChange={(v) => setEmp({ ...emp, consent_privacy: v })}
              label={l.consent}
              linkText={l.privacyLink}
              linkHref={`/${locale}/legal/privacy`}
            />
            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition disabled:opacity-50">
              {loading ? l.registering : l.registerBtn}
            </button>
          </form>
        )}

        {/* Step 2: Job posting */}
        {step === "post" && employerId && (
          <form onSubmit={submitJob} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">{l.jobTitle}</label>
              <input name="title" required value={job.title} onChange={handleJobChange} placeholder={l.jobTitlePh} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">{l.jobDesc}</label>
              <textarea name="description" required rows={6} value={job.description} onChange={handleJobChange} placeholder={l.jobDescPh} className={`${inputCls} resize-none`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.location}</label>
                <input name="location" value={job.location} onChange={handleJobChange} placeholder={l.locationPh} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.salary}</label>
                <input name="salary_range" value={job.salary_range} onChange={handleJobChange} placeholder={l.salaryPh} className={inputCls} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.type}</label>
                <select name="employment_type" value={job.employment_type} onChange={handleJobChange} className={inputCls}>
                  <option value="full-time">{l.typeFullTime}</option>
                  <option value="part-time">{l.typePartTime}</option>
                  <option value="contract">{l.typeContract}</option>
                  <option value="freelance">{l.typeFreelance}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.workMode}</label>
                <select name="work_mode" value={job.work_mode} onChange={handleJobChange} className={inputCls}>
                  <option value="on-site">{l.modeOnSite}</option>
                  <option value="hybrid">{l.modeHybrid}</option>
                  <option value="remote">{l.modeRemote}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">{l.language}</label>
                <select name="language" value={job.language} onChange={handleJobChange} className={inputCls}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition disabled:opacity-50">
              {loading ? l.publishing : l.publishBtn}
            </button>
          </form>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-3">{l.successTitle}</h2>
            <p className="text-slate-400 mb-6">{l.successSub}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep("post")}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
              >
                {l.postAnother}
              </button>
              <Link
                href={`/${locale}/jobs`}
                className="px-6 py-2.5 border border-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition"
              >
                {l.viewJobs}
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
