export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
          <h1 className="text-2xl font-bold text-blue-600">BeJoby</h1>
          <nav className="space-x-6 text-gray-700 font-medium">
            <a href="/empresas">Empresas</a>
            <a href="/candidatos">Candidatos</a>
            <a href="/coaching">Coaching</a>
            <a href="/cursos">Cursos</a>
            <a href="/blog">Blog</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="text-center px-6">
          <h2 className="text-4xl sm:text-6xl font-bold mb-6">
            Conectando talento con oportunidades
          </h2>
          <p className="text-lg sm:text-xl mb-8">
            BeJoby es tu plataforma de coaching y empleabilidad para el futuro laboral.
          </p>
          <a
            href="#"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow hover:bg-gray-100"
          >
            Empieza Ahora
          </a>
        </div>
      </section>
    </main>
  );
}
