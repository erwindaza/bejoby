import CoachingForm from "@/components/CoachingForm";

export default function ContactoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-6">
      <div className="w-full max-w-2xl bg-white text-gray-900 rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Contacto y Coaching</h1>
        <p className="text-center mb-8">
          Elige entre conversar con nuestro <span className="text-purple-600">Coach Virtual Gratis </span> 
          o acceder al plan <span className="font-semibold">BeJoby Coach Pro 💎</span> con asesoría personalizada.
        </p>

        <CoachingForm />
      </div>
    </main>
  );
}
