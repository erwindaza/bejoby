export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <h1 className="text-5xl font-extrabold mb-6">BeJoby</h1>
      <p className="text-xl mb-4">Conectando talento con oportunidades</p>
      <p className="mb-8 text-center max-w-2xl">
        BeJoby es tu plataforma de coaching y empleabilidad para el futuro laboral.
      </p>
      <a
        href="/candidatos"
        className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100"
      >
        Empieza Ahora
      </a>
    </main>
  );
}

