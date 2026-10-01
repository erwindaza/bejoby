"use client";

import { useState, useEffect, useRef } from "react";
import CoachConsentModal from "./CoachConsentModal";

interface Message {
  role: "user" | "coach";
  text: string;
}

const placeholderText = {
  es: "Ej: ¿cómo mejoro mi CV para trabajos en cloud?",
  en: "E.g.: how do I improve my CV for cloud jobs?",
};

const welcomeText = {
  es: "¡Hola! Soy tu Coach Laboral. Pregúntame sobre empleabilidad, entrevistas, CV o qué skill mejorar. Te guiaré con contenido gratuito.",
  en: "Hi! I'm your Career Coach. Ask me about employability, interviews, CVs, or which skill to improve. I'll guide you with free content.",
};

const disclaimerText = {
  es: "El coach no guarda tu conversación. Las recomendaciones usan contenido verificado de aif369.com.",
  en: "The coach does not store your conversation. Recommendations use verified content from aif369.com.",
};

export default function CoachChat({ locale }: { locale: string }) {
  const lang = locale === "en" ? "en" : "es";
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "coach", text: welcomeText[lang] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem("bejoby_coach_consent") === "true";
    setHasConsent(consent);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText }),
      });

      if (!res.ok) throw new Error("Coach error");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: data.reply || "..." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          text:
            lang === "en"
              ? "Sorry, I couldn't process your question. Please try again."
              : "Lo siento, no pude procesar tu pregunta. Intenta nuevamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (hasConsent === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasConsent) {
    return <CoachConsentModal onAccepted={() => setHasConsent(true)} />;
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[70vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-slate-800 text-slate-200 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 px-4 py-3 rounded-2xl text-sm">
              ...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-700 p-4 bg-slate-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={placeholderText[lang]}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-semibold rounded-xl transition"
          >
            {lang === "en" ? "Send" : "Enviar"}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">{disclaimerText[lang]}</p>
      </div>
    </div>
  );
}
