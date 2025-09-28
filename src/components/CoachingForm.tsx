// src/components/CoachingForm.tsx
"use client";

import { useState } from "react";
import PayPalButton from "@/components/PayPalButton";

export default function CoachingForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [status, setStatus] = useState<string | null>(null);

  const handleFreePlan = async () => {
    setStatus("Conectando con Coach Virtual...");
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      setStatus(`✅ ${data.message}`);
    } catch {
      setStatus("❌ Error conectando con Coach Virtual.");
    }
  };

  const handleVerifyPayment = async (orderID: string) => {
    try {
      const res = await fetch("/api/paypal/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus("💎 Pago verificado. Acceso a Coach Pro desbloqueado.");
      } else {
        setStatus("❌ El pago no se completó correctamente.");
      }
    } catch {
      setStatus("❌ Error verificando el pago.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white text-gray-900 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4 text-center">
        Elige tu plan en <span className="text-purple-600">BeJoby Coach</span>
      </h2>

      <input
        type="text"
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded-lg"
      />

      <input
        type="email"
        placeholder="Tu correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 px-4 py-2 border rounded-lg"
      />

      <div className="flex justify-around mb-6">
        <label>
          <input
            type="radio"
            name="plan"
            value="free"
            checked={plan === "free"}
            onChange={() => setPlan("free")}
          />{" "}
          Coach Virtual Gratis
        </label>
        <label>
          <input
            type="radio"
            name="plan"
            value="pro"
            checked={plan === "pro"}
            onChange={() => setPlan("pro")}
          />{" "}
          BeJoby Coach Pro 💎
        </label>
      </div>

      {plan === "free" ? (
        <button
          onClick={handleFreePlan}
          className="w-full bg-purple-600 text-white py-2 rounded-lg"
        >
          Conectar con Coach Virtual
        </button>
      ) : (
        <PayPalButton
          amount={25.0}
          onSuccess={(details: { orderID: string }) =>
            handleVerifyPayment(details.orderID)
          }
          onError={() => setStatus("❌ Error en el pago.")}
        />
      )}

      {status && (
        <p
          className={`mt-4 text-center text-sm font-medium ${
            status.startsWith("✅") || status.startsWith("💎")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}
