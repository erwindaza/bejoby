// src/app/[locale]/empresas/page.tsx — B2B landing page for employers
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, TrendingUp, Clock, BarChart3 } from "lucide-react";
import ConsentCheckbox from "@/components/ConsentCheckbox";

export default function EmpresasPage() {
  const params = useParams();
  const locale = (params.locale as string) || "es";
  const isEnglish = locale === "en";

  const t = {
    es: {
      nav_title: "Para Empresas",
      hero_title: "Contrata 3x más rápido con IA",
      hero_subtitle: "Encuentra y evalúa candidatos automáticamente. Sin intermediarios.",
      hero_cta: "Publicar oferta gratis",
      hero_secondary: "Ver demo",

      metrics_title: "Empresas en Latinoamérica confían en BeJoby",
      metric_1_label: "Tiempo promedio",
      metric_1_value: "< 7 días",
      metric_2_label: "Menos revisión",
      metric_2_value: "60% menos",
      metric_3_label: "Match score",
      metric_3_value: "0-100%",

      howitworks_title: "Cómo funciona",
      howitworks_step1: "Publica una oferta en 2 minutos",
      howitworks_step2: "Nuestra IA analiza candidatos automáticamente",
      howitworks_step3: "Ves un ranking con los mejores candidatos",
      howitworks_step4: "Selecciona y contrata",

      plans_title: "Planes simples y transparentes",
      plan_basic_name: "Básico",
      plan_basic_price: "$9.99/mes",
      plan_basic_offers: "Hasta 3 ofertas activas",
      plan_pro_name: "Pro",
      plan_pro_price: "$49.99/mes",
      plan_pro_offers: "Ofertas ilimitadas",
      plan_enterprise_name: "Enterprise",
      plan_enterprise_price: "Personalizado",
      plan_enterprise_offers: "API + integración ATS",
      plan_feature_1: "Análisis IA de candidatos",
      plan_feature_2: "Scoring automático",
      plan_feature_3: "Reporte de compatibilidad",
      plan_feature_4: "Acceso API",
      plan_feature_5: "Soporte prioritario",
      plan_feature_6: "Integración ATS",

      testimonials_title: "Testimonios",
      testimonial_1_name: "Empresa Tecnológica",
      testimonial_1_role: "Jefa de RRHH",
      testimonial_1_text: "Antes gastaba 2 semanas revisando CVs. Ahora veo a los mejores candidatos en el primer día.",
      testimonial_2_name: "Startup de Fintech",
      testimonial_2_role: "Founder",
      testimonial_2_text: "La IA de BeJoby realmente entiende nuestras necesidades. Hemos contratado a 5 personas en 3 meses.",
      testimonial_3_name: "Consultoría",
      testimonial_3_role: "Manager de Talento",
      testimonial_3_text: "El scoring automático nos ahorra horas de análisis. Increíblemente útil.",

      contact_title: "Prueba gratis por 30 días",
      contact_subtitle: "Una oferta completa, sin tarjeta de crédito",
      contact_name: "Nombre",
      contact_email: "Email",
      contact_company: "Empresa",
      contact_message: "Mensaje (opcional)",
      contact_consent: "Acepto los",
      contact_privacy: "términos de privacidad",
      contact_submit: "Enviar solicitud",
      contact_loading: "Enviando...",
      contact_success: "¡Solicitud enviada! Nos pondremos en contacto pronto.",
      contact_error: "Error al enviar. Intenta de nuevo.",
    },
    en: {
      nav_title: "For Employers",
      hero_title: "Hire 3x faster with AI",
      hero_subtitle: "Find and evaluate candidates automatically. No middlemen.",
      hero_cta: "Post a job for free",
      hero_secondary: "See demo",

      metrics_title: "Companies across Latin America trust BeJoby",
      metric_1_label: "Avg. time",
      metric_1_value: "< 7 days",
      metric_2_label: "Less review",
      metric_2_value: "60% less",
      metric_3_label: "Match score",
      metric_3_value: "0-100%",

      howitworks_title: "How it works",
      howitworks_step1: "Post a job in 2 minutes",
      howitworks_step2: "Our AI analyzes candidates automatically",
      howitworks_step3: "See a ranking with the best candidates",
      howitworks_step4: "Select and hire",

      plans_title: "Simple and transparent plans",
      plan_basic_name: "Starter",
      plan_basic_price: "$9.99/mo",
      plan_basic_offers: "Up to 3 active jobs",
      plan_pro_name: "Pro",
      plan_pro_price: "$49.99/mo",
      plan_pro_offers: "Unlimited jobs",
      plan_enterprise_name: "Enterprise",
      plan_enterprise_price: "Custom",
      plan_enterprise_offers: "API + ATS integration",
      plan_feature_1: "AI candidate analysis",
      plan_feature_2: "Automatic scoring",
      plan_feature_3: "Compatibility report",
      plan_feature_4: "API access",
      plan_feature_5: "Priority support",
      plan_feature_6: "ATS integration",

      testimonials_title: "Testimonials",
      testimonial_1_name: "Tech Company",
      testimonial_1_role: "HR Manager",
      testimonial_1_text: "I used to spend 2 weeks reviewing CVs. Now I see the best candidates on day one.",
      testimonial_2_name: "Fintech Startup",
      testimonial_2_role: "Founder",
      testimonial_2_text: "BeJoby's AI truly understands our needs. We've hired 5 people in 3 months.",
      testimonial_3_name: "Consulting Firm",
      testimonial_3_role: "Talent Manager",
      testimonial_3_text: "Automatic scoring saves us hours of analysis. Incredibly useful.",

      contact_title: "Try free for 30 days",
      contact_subtitle: "One complete job posting, no credit card required",
      contact_name: "Name",
      contact_email: "Email",
      contact_company: "Company",
      contact_message: "Message (optional)",
      contact_consent: "I accept the",
      contact_privacy: "privacy terms",
      contact_submit: "Send request",
      contact_loading: "Sending...",
      contact_success: "Request sent! We'll be in touch soon.",
      contact_error: "Error sending. Try again.",
    },
  };

  const copy = isEnglish ? t.en : t.es;

  const [formData, setFormData] = useState({ name: "", email: "", company: "", message: "" });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;

    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: `Empresa: ${formData.company}\n\n${formData.message}`,
          source: "b2b-landing",
        }),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", company: "", message: "" });
        setConsent(false);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-950/60 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">{copy.hero_title}</h1>
          <p className="text-xl text-slate-300 mb-8">{copy.hero_subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/post-job`}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition"
            >
              {copy.hero_cta}
            </Link>
            <button className="px-8 py-3 border border-slate-600 hover:border-slate-500 text-white font-semibold rounded-xl transition">
              {copy.hero_secondary}
            </button>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{copy.metrics_title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-slate-400 mb-2">{copy.metric_1_label}</p>
              <p className="text-4xl font-bold">{copy.metric_1_value}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-slate-400 mb-2">{copy.metric_2_label}</p>
              <p className="text-4xl font-bold">{copy.metric_2_value}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-slate-400 mb-2">{copy.metric_3_label}</p>
              <p className="text-4xl font-bold">{copy.metric_3_value}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{copy.howitworks_title}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              copy.howitworks_step1,
              copy.howitworks_step2,
              copy.howitworks_step3,
              copy.howitworks_step4,
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold mb-4 flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{copy.plans_title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: copy.plan_basic_name, price: copy.plan_basic_price, offers: copy.plan_basic_offers, highlight: false },
              { name: copy.plan_pro_name, price: copy.plan_pro_price, offers: copy.plan_pro_offers, highlight: true },
              { name: copy.plan_enterprise_name, price: copy.plan_enterprise_price, offers: copy.plan_enterprise_offers, highlight: false },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-xl p-8 ${
                  plan.highlight
                    ? "bg-gradient-to-b from-blue-600/20 to-blue-600/5 border-2 border-blue-500"
                    : "bg-slate-800/50 border border-slate-700"
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4 text-blue-500">{plan.price}</p>
                <p className="text-slate-300 mb-6">{plan.offers}</p>
                <ul className="space-y-3 mb-8">
                  {[
                    copy.plan_feature_1,
                    copy.plan_feature_2,
                    copy.plan_feature_3,
                    ...(i === 1 ? [copy.plan_feature_4, copy.plan_feature_5] : []),
                    ...(i === 2 ? [copy.plan_feature_4, copy.plan_feature_5, copy.plan_feature_6] : []),
                  ].map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2 rounded-lg font-semibold transition ${
                  plan.highlight
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "border border-slate-600 text-white hover:border-slate-500"
                }`}>
                  {copy.hero_cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{copy.testimonials_title}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: copy.testimonial_1_name,
                role: copy.testimonial_1_role,
                text: copy.testimonial_1_text,
              },
              {
                name: copy.testimonial_2_name,
                role: copy.testimonial_2_role,
                text: copy.testimonial_2_text,
              },
              {
                name: copy.testimonial_3_name,
                role: copy.testimonial_3_role,
                text: copy.testimonial_3_text,
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
                <p className="text-slate-300 mb-6 italic">&quot;{testimonial.text}&quot;</p>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-slate-400 text-sm">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">{copy.contact_title}</h2>
          <p className="text-slate-400 text-center mb-8">{copy.contact_subtitle}</p>

          {status === "success" ? (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-green-300 text-center">
              {copy.contact_success}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={copy.contact_name}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="email"
                placeholder={copy.contact_email}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="text"
                placeholder={copy.contact_company}
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <textarea
                placeholder={copy.contact_message}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
              <ConsentCheckbox
                id="b2b-consent"
                checked={consent}
                onChange={setConsent}
                label={copy.contact_consent}
                linkText={copy.contact_privacy}
                linkHref={`/${locale}/legal/privacy`}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {loading ? copy.contact_loading : copy.contact_submit}
              </button>

              {status === "error" && (
                <p className="text-red-400 text-sm text-center">{copy.contact_error}</p>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
