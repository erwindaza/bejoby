export default function LandingPage() {
  return (
    <section className="h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-indigo-700 via-purple-700 to-black text-white">
      <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
        Conectando talento con oportunidades
      </h1>
      <p className="max-w-2xl text-lg md:text-xl mb-10">
        BeJoby es tu plataforma de <span className="text-yellow-400">coaching</span>,{" "}
        <span className="text-indigo-300">empleabilidad</span> y{" "}
        <span className="text-purple-300">futuro laboral</span>.
      </p>
      <a
        href="/candidatos"
        className="btn-primary shadow-2xl"
      >
        🚀 Empieza Ahora
      </a>
    </section>
  );
}
