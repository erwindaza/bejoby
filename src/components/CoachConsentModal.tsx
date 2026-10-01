"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ConsentCheckbox from "./ConsentCheckbox";

interface CoachConsentModalProps {
  onAccepted: () => void;
}

const consentText = {
  es: {
    title: "Antes de comenzar con el Coach",
    intro:
      "BeJoby Coach te orienta con contenido gratuito verificado de aif369.com para que mejores tus skills sin gastar dinero.",
    points: [
      "No guardamos tu conversación ni la usamos para entrenar modelos.",
      "El coach no toma decisiones por ti; solo orienta y ordena pasos.",
      "Si compartes datos personales, recuerda que el proveedor de IA puede retenerlos según sus términos.",
      "Nunca te pediremos datos de salud, financieros ni contraseñas.",
    ],
    checkboxLabel: "Entiendo y acepto usar el Coach Laboral de BeJoby con estas condiciones.",
    policyLinkText: "política de privacidad",
    acceptBtn: "Comenzar",
    errorRequired: "Debes aceptar las condiciones para continuar.",
  },
  en: {
    title: "Before starting with the Coach",
    intro:
      "BeJoby Coach guides you with free verified content from aif369.com so you can improve your skills without spending money.",
    points: [
      "We do not store your conversation or use it to train models.",
      "The coach does not make decisions for you; it only guides and organizes steps.",
      "If you share personal data, remember that the AI provider may retain it according to their terms.",
      "We will never ask for health, financial data, or passwords.",
    ],
    checkboxLabel: "I understand and accept to use BeJoby Career Coach under these conditions.",
    policyLinkText: "privacy policy",
    acceptBtn: "Start",
    errorRequired: "You must accept the conditions to continue.",
  },
};

const POLICY_VERSION = "1.0-coach";
const COACH_CONSENT_SNAPSHOT = {
  es: `BeJoby Coach te orienta con contenido gratuito verificado de aif369.com.
No guardamos tu conversación ni la usamos para entrenar modelos.
El coach no toma decisiones por ti; solo orienta y ordena pasos.
Si compartes datos personales, el proveedor de IA puede retenerlos según sus términos.
Nunca te pediremos datos de salud, financieros ni contraseñas.`,
  en: `BeJoby Coach guides you with free verified content from aif369.com.
We do not store your conversation or use it to train models.
The coach does not make decisions for you; it only guides and organizes steps.
If you share personal data, the AI provider may retain it according to their terms.
We will never ask for health, financial data, or passwords.`,
};

export default function CoachConsentModal({ onAccepted }: CoachConsentModalProps) {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "en" ? "en" : "es";
  const t = consentText[lang];

  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      setError(t.errorRequired);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/privacy/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent_type: "coach_usage",
          purpose: "Permitir el uso del coach laboral asistido por IA",
          policy_version: POLICY_VERSION,
          consent_text_snapshot: COACH_CONSENT_SNAPSHOT[lang],
          accepted: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Error registrando el consentimiento.");
        return;
      }

      localStorage.setItem("bejoby_coach_consent", "true");
      onAccepted();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-3">{t.title}</h2>
        <p className="text-slate-300 text-sm mb-4">{t.intro}</p>

        <ul className="space-y-2 mb-6">
          {t.points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-blue-400 mt-0.5">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="mb-6">
          <ConsentCheckbox
            id="coach-consent-checkbox"
            checked={accepted}
            onChange={(checked) => {
              setAccepted(checked);
              if (checked) setError("");
            }}
            label={t.checkboxLabel}
            linkText={` ${t.policyLinkText}`}
            linkHref={`/${locale}/legal/privacy`}
            required
            error={error}
          />
        </div>

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-semibold rounded-xl transition"
        >
          {loading ? "..." : t.acceptBtn}
        </button>
      </div>
    </div>
  );
}

export { POLICY_VERSION, COACH_CONSENT_SNAPSHOT };
