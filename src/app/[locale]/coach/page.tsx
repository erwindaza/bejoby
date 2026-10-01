// src/app/[locale]/coach/page.tsx — Coach Laboral con IA
import CoachChat from "@/components/CoachChat";

export default async function CoachPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          {isEs ? "Coach Laboral con IA" : "AI Career Coach"}
        </h1>
        <p className="text-slate-400">
          {isEs
            ? "Orientación práctica y gratuita para mejorar tu empleabilidad. Pregunta lo que necesites."
            : "Practical and free guidance to improve your employability. Ask anything you need."}
        </p>
      </div>

      <CoachChat locale={locale} />
    </div>
  );
}
