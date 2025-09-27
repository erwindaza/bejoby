export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
          <h1 className="text-2xl font-bold text-blue-600">BeJoby</h1>
          <nav className="space-x-6 text-gray-700 font-medium">
            <a href="#">Empresas</a>
            <a href="#">Candidatos</a>
            <a href="#">Coaching</a>
            <a href="#">Cursos</a>
            <a href="#">Blog</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center px-6">
        <div>
          <h2 className="text-4xl sm:text-6xl font-bold mb-6">
            Encuentra talento y oportunidades con IA
          </h2>
          <p className="text-lg sm:text-xl mb-8">
            Transparencia salarial, headhunting inteligente y coaching para todos.
          </p>
          <button className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-100 transition">
            📄 Sube tu CV
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-8">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>© 2025 BeJoby. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}