import Hero from "@/components/Hero";
import SubscribeForm from "@/components/SubscribeForm";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center">
      {/* Hero con animación */}
      <Hero />

      {/* Sección de suscripción */}
      <section className="w-full py-20 bg-gray-50 text-gray-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Únete a la comunidad BeJoby 🚀
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Recibe tips de empleabilidad, coaching y nuevas oportunidades directamente en tu correo.
          </p>
          <SubscribeForm />
        </div>
      </section>
    </main>
  );
}


