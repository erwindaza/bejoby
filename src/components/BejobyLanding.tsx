"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const tourAreas = [
  {
    id: "recepcion",
    title: "Recepción IA",
    badge: "IA anfitriona",
    description:
      "Te damos la bienvenida y guiamos la ruta ideal según tu rol. Todo comienza con una conversación inteligente.",
    reply: "Quiero conocer el portal de talento.",
  },
  {
    id: "talento",
    title: "Talento & Jobseekers",
    badge: "Coach IA",
    description:
      "Tu perfil se crea con CV guiado, entrevistas automáticas y recomendaciones en tiempo real.",
    reply: "Necesito ayuda con mi CV.",
  },
  {
    id: "empresas",
    title: "Empresas & Recruiters",
    badge: "Recruiter IA",
    description:
      "Publica vacantes, recibe shortlists y coordina entrevistas con asistencia IA.",
    reply: "Busco 3 perfiles de data.",
  },
  {
    id: "evaluaciones",
    title: "Evaluaciones Técnicas",
    badge: "Score IA",
    description:
      "Pruebas prácticas, scoring automático y feedback inmediato para talento.",
    reply: "¿Hay pruebas de frontend?",
  },
  {
    id: "analitica",
    title: "Analítica & Insights",
    badge: "Insights",
    description: "Dashboards de pipeline, time-to-hire y calidad del matching.",
    reply: "Muestra mi funnel de candidatos.",
  },
  {
    id: "soporte",
    title: "Soporte Continuo",
    badge: "24/7",
    description: "Onboarding, soporte 24/7 y seguimiento de colocaciones.",
    reply: "Necesito soporte para entrevistas.",
  },
];

const cvSample = {
  name: "Sofía Torres",
  role: "Product Designer",
  years: "6",
  skills: "UX Research, Figma, Prototyping, HTML/CSS",
  city: "Bogotá",
};

export default function BejobyLanding() {
  const [activeTour, setActiveTour] = useState(0);
  const [activePortal, setActivePortal] = useState<"talento" | "empresas">("talento");
  const [modalOpen, setModalOpen] = useState(false);
  const [cvParsed, setCvParsed] = useState(false);
  const [cvFileName, setCvFileName] = useState("");
  const [cvText, setCvText] = useState("");
  const [parseMessage, setParseMessage] = useState("");
  const [parsing, setParsing] = useState(false);
  const [cvState, setCvState] = useState({
    name: "",
    role: "",
    years: "",
    skills: "",
    city: "",
  });

  const currentTour = useMemo(() => tourAreas[activeTour], [activeTour]);

  const extractLineValue = (text: string, label: string) => {
    const pattern = new RegExp(`${label}\\s*[:\\-]\\s*(.+)`, "i");
    const match = text.match(pattern);
    return match ? match[1].trim() : "";
  };

  const parseCvText = (text: string) => {
    const cleaned = text.replace(/\r/g, "").trim();
    if (cleaned.length < 20) {
      return cvSample;
    }

    const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);
    const emailMatch = cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const yearsMatch = cleaned.match(/(\d{1,2})\s*(años|years)/i);
    const nameLine = lines.find((line) => line.length > 3 && !line.includes("@")) ?? cvSample.name;

    const role =
      extractLineValue(cleaned, "Rol") ||
      extractLineValue(cleaned, "Role") ||
      extractLineValue(cleaned, "Cargo") ||
      lines.find((line) => /designer|engineer|analyst|manager|developer/i.test(line)) ||
      cvSample.role;

    const skills =
      extractLineValue(cleaned, "Skills") ||
      extractLineValue(cleaned, "Tecnologías") ||
      extractLineValue(cleaned, "Herramientas") ||
      lines.find((line) => line.includes(",") && line.length < 80) ||
      cvSample.skills;

    const city =
      extractLineValue(cleaned, "Ciudad") ||
      extractLineValue(cleaned, "Location") ||
      extractLineValue(cleaned, "Ubicación") ||
      cvSample.city;

    return {
      name: nameLine,
      role,
      years: yearsMatch ? yearsMatch[1] : cvSample.years,
      skills,
      city,
    };
  };

  const handleParseCv = (source: "sample" | "text") => {
    setParsing(true);
    setParseMessage(source === "text" ? "Analizando tu CV con IA..." : "Simulando parsing IA...");
    const payload = source === "text" ? parseCvText(cvText) : cvSample;
    setTimeout(() => {
      setCvState(payload);
      setCvParsed(true);
      setParsing(false);
      setParseMessage("Parsing completado. Puedes ajustar tus datos.");
    }, 650);
  };

  return (
    <div className="min-h-screen bg-page text-sand">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <span className="font-display text-2xl tracking-wide">bejoby</span>
            <span className="text-xs uppercase tracking-[0.3em] text-sand/50">job portal + IA tour</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-sand/70 md:flex">
            <Link href="#tour" className="hover:text-sand">Recorrido</Link>
            <Link href="#portal" className="hover:text-sand">Portal</Link>
            <Link href="#stack" className="hover:text-sand">IA Stack</Link>
            <Link href="#trust" className="hover:text-sand">Confianza</Link>
          </nav>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-sand/80 transition hover:border-white/30 hover:text-sand"
            onClick={() => setModalOpen(true)}
          >
            Ingresar
          </button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-coral">bejoby.com</p>
            <h1 className="font-display text-4xl leading-tight text-sand md:text-5xl">
              El portal donde talento y empresas se conocen cara a cara con IA.
            </h1>
            <p className="text-base text-sand/70">
              Recorridos virtuales por cada área de nuestra empresa con asistentes inteligentes. Talento con CV
              guiado, empresas con reclutamiento asistido y analítica en tiempo real.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#tour"
                className="rounded-full bg-sunset px-6 py-3 text-sm font-semibold text-ink shadow-glow"
              >
                Iniciar recorrido guiado
              </a>
              <a
                href="#portal"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-sand"
              >
                Entrar al portal
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">+42%</p>
                <span className="text-xs text-sand/60">match rate IA</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">8 min</p>
                <span className="text-xs text-sand/60">onboarding talento</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">2 clics</p>
                <span className="text-xs text-sand/60">publicar vacante</span>
              </div>
            </div>
          </div>

          <div className="relative grid gap-4">
            <div className="absolute -top-12 right-0 h-40 w-40 rounded-full bg-coral/30 blur-3xl" />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold text-sand">Centro de operaciones IA</p>
              <p className="mt-3 text-sm text-sand/70">
                Un asistente por cada área: talento, empresas, evaluaciones, analítica y soporte.
              </p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-sand/60">Estado: activo</span>
                <span className="inline-flex h-3 w-3 rounded-full bg-cyan shadow-cyan" />
              </div>
            </div>
            <div className="rounded-2xl border border-coral/30 bg-gradient-to-br from-white/10 to-ink/80 p-6">
              <p className="text-sm font-semibold text-sand">CV inteligente</p>
              <p className="mt-3 text-sm text-sand/70">
                Sube tu CV y deja que la IA estructure tu perfil en segundos.
              </p>
              <button
                className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-sand"
                onClick={() => handleParseCv("sample")}
              >
                Simular parsing
              </button>
            </div>
          </div>
        </section>

        <section id="tour" className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="mb-6">
            <h2 className="font-display text-3xl">Recorrido virtual por la empresa</h2>
            <p className="mt-2 text-sand/70">Selecciona un área y conversa con el asistente especializado.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="grid gap-3">
                {tourAreas.map((area, index) => (
                  <button
                    key={area.id}
                    onClick={() => setActiveTour(index)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                      index === activeTour
                        ? "border-cyan/60 bg-cyan/10"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span>{area.title}</span>
                    <span className="text-xs text-sand/50">IA</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-ink/80 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{currentTour.title}</h3>
                <span className="rounded-full border border-coral/40 px-3 py-1 text-xs text-coral">
                  {currentTour.badge}
                </span>
              </div>
              <p className="mt-4 text-sm text-sand/70">{currentTour.description}</p>
              <div className="mt-6 space-y-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  Hola, soy BeJo, tu guía. ¿Buscas talento o un nuevo rol?
                </div>
                <div className="rounded-2xl border border-coral/30 bg-coral/10 p-3 text-right">
                  {currentTour.reply}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-cyan px-4 py-2 text-xs font-semibold text-ink"
                  onClick={() => setActiveTour((prev) => (prev + 1) % tourAreas.length)}
                >
                  Siguiente área
                </button>
                <button className="rounded-full border border-white/10 px-4 py-2 text-xs text-sand">
                  Preguntar a IA
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="portal" className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="mb-6">
            <h2 className="font-display text-3xl">Portal bejoby</h2>
            <p className="mt-2 text-sand/70">Acceso dual: talento y empresas. Todo en un solo flujo IA.</p>
          </div>
          <div className="mb-6 flex gap-3">
            {(["talento", "empresas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePortal(tab)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  activePortal === tab
                    ? "bg-sunset text-ink"
                    : "border border-white/10 text-sand"
                }`}
              >
                {tab === "talento" ? "Soy talento" : "Soy empresa"}
              </button>
            ))}
          </div>

          {activePortal === "talento" ? (
            <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xl font-semibold">Acceso talento</h3>
                <p className="mt-2 text-sm text-sand/70">Ingresa con email y contraseña para comenzar tu perfil.</p>
                <div className="mt-4 grid gap-3">
                  <input className="input" type="email" placeholder="tu@email.com" />
                  <input className="input" type="password" placeholder="••••••••" />
                  <button className="rounded-full bg-sunset px-4 py-2 text-sm font-semibold text-ink">
                    Ingresar
                  </button>
                </div>
                <div className="my-6 h-px w-full bg-white/10" />
                <h4 className="font-semibold">Sube tu CV</h4>
                <input
                  className="mt-3 text-sm text-sand/70"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setCvFileName(file ? file.name : "");
                  }}
                />
                {cvFileName && (
                  <p className="mt-2 text-xs text-sand/60">Archivo cargado: {cvFileName}</p>
                )}
                <textarea
                  className="input mt-4 h-24 rounded-2xl"
                  placeholder="Pega aquí tu CV para parsing inteligente (nombre, rol, skills, ciudad)."
                  value={cvText}
                  onChange={(event) => setCvText(event.target.value)}
                />
                <button
                  className="mt-3 rounded-full border border-white/15 px-4 py-2 text-xs text-sand"
                  onClick={() => handleParseCv("text")}
                  disabled={parsing}
                >
                  {parsing ? "Procesando..." : "Parsear CV con IA"}
                </button>
                {parseMessage && <p className="mt-2 text-xs text-sand/60">{parseMessage}</p>}
                <p className="mt-2 text-xs text-sand/60">
                  La IA detecta nombre, experiencia, skills y educación.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Perfil guiado</h3>
                <div className="mt-4 grid gap-3">
                  <input
                    className="input"
                    type="text"
                    placeholder="Nombre completo"
                    value={cvState.name}
                    onChange={(event) => setCvState({ ...cvState, name: event.target.value })}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Rol principal"
                    value={cvState.role}
                    onChange={(event) => setCvState({ ...cvState, role: event.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Años de experiencia"
                    value={cvState.years}
                    onChange={(event) => setCvState({ ...cvState, years: event.target.value })}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Skills clave"
                    value={cvState.skills}
                    onChange={(event) => setCvState({ ...cvState, skills: event.target.value })}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Ciudad"
                    value={cvState.city}
                    onChange={(event) => setCvState({ ...cvState, city: event.target.value })}
                  />
                  <button className="rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-ink">
                    Crear perfil
                  </button>
                </div>
                <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm">
                  <h4 className="font-semibold">Coach IA</h4>
                  <p className="mt-2 text-sand/70">
                    {cvParsed
                      ? "Perfil analizado. Te sugerimos vacantes según tu progreso y expectativas salariales."
                      : "Te sugerimos vacantes según tu progreso y expectativas salariales."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xl font-semibold">Acceso empresas</h3>
                <p className="mt-2 text-sm text-sand/70">Gestiona tu reclutamiento en un solo tablero.</p>
                <div className="mt-4 grid gap-3">
                  <input className="input" type="email" placeholder="rrhh@empresa.com" />
                  <input className="input" type="password" placeholder="••••••••" />
                  <button className="rounded-full bg-sunset px-4 py-2 text-sm font-semibold text-ink">
                    Ingresar
                  </button>
                </div>
                <div className="my-6 h-px w-full bg-white/10" />
                <button className="rounded-full border border-white/15 px-4 py-2 text-xs text-sand">
                  Agendar demo
                </button>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Publica una vacante</h3>
                <div className="mt-4 grid gap-3">
                  <input className="input" type="text" placeholder="Rol" />
                  <input className="input" type="text" placeholder="Stack" />
                  <select className="input">
                    <option>Mid</option>
                    <option>Senior</option>
                    <option>Lead</option>
                  </select>
                  <input className="input" type="text" placeholder="Ubicación" />
                  <button className="rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-ink">
                    Publicar
                  </button>
                </div>
                <div className="mt-6 rounded-2xl border border-cyan/30 bg-cyan/10 p-4 text-sm">
                  <h4 className="font-semibold">Recruiter IA</h4>
                  <p className="mt-2 text-sand/70">
                    Detectamos candidatos con mayor compatibilidad cultural y técnica.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section id="stack" className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="mb-6">
            <h2 className="font-display text-3xl">Stack de IA</h2>
            <p className="mt-2 text-sand/70">Arquitectura híbrida para escalar con seguridad y velocidad.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Mistral AI local",
                copy: "Desarrollo rápido, control de datos y pruebas con prompts privados.",
                tag: "Entorno local",
              },
              {
                title: "Gemini Flash 2.5 en Vertex AI",
                copy: "Escalamiento productivo, alta concurrencia y SLA empresarial.",
                tag: "Futuro productivo",
              },
              {
                title: "Servicios IA modulares",
                copy: "Chat, parsing de CV, matching y scoring conectados por APIs.",
                tag: "Microservicios",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-sand/70">{item.copy}</p>
                <span className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-coral">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="trust" className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="mb-6">
            <h2 className="font-display text-3xl">Confianza y seguridad</h2>
            <p className="mt-2 text-sand/70">Protegemos datos de talento y empresas con estándares de clase mundial.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Datos cifrados",
                copy: "En tránsito y en reposo, con control de acceso granular.",
              },
              {
                title: "Sesiones seguras",
                copy: "Login con email, MFA opcional y alertas de acceso.",
              },
              {
                title: "Auditoría continua",
                copy: "Logs de actividad, métricas de IA y governance.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-sand/70">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-sand/60">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <div>
            <strong className="text-sand">bejoby.com</strong>
            <p className="text-xs">Conectando talento y empresas con IA humana.</p>
          </div>
          <div className="flex gap-4 text-xs">
            <span>Privacidad</span>
            <span>Términos</span>
            <span>Contacto</span>
          </div>
        </div>
      </footer>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-ink p-6">
            <button
              className="absolute right-4 top-4 text-lg text-sand/60"
              onClick={() => setModalOpen(false)}
            >
              ×
            </button>
            <h3 className="text-xl font-semibold">Acceso rápido</h3>
            <p className="mt-2 text-sm text-sand/70">
              Inicia sesión para continuar el recorrido personalizado.
            </p>
            <div className="mt-4 grid gap-3">
              <input className="input" type="email" placeholder="tu@email.com" />
              <input className="input" type="password" placeholder="••••••••" />
              <button className="rounded-full bg-sunset px-4 py-2 text-sm font-semibold text-ink">
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
