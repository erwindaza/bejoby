// src/components/LoginModal.tsx — Email OTP login modal
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";

const texts = {
  es: {
    title: "Inicia sesión",
    subtitle: "Ingresa tu email y te enviaremos un código de verificación",
    emailLabel: "Email",
    emailPh: "tu@email.com",
    sendCode: "Enviar código",
    sending: "Enviando...",
    codeTitle: "Ingresa el código",
    codeSub: "Enviamos un código de 6 dígitos a",
    verify: "Verificar",
    verifying: "Verificando...",
    resend: "Reenviar código",
    changeEmail: "Cambiar email",
    close: "Cerrar",
  },
  en: {
    title: "Sign in",
    subtitle: "Enter your email and we'll send you a verification code",
    emailLabel: "Email",
    emailPh: "you@email.com",
    sendCode: "Send code",
    sending: "Sending...",
    codeTitle: "Enter the code",
    codeSub: "We sent a 6-digit code to",
    verify: "Verify",
    verifying: "Verifying...",
    resend: "Resend code",
    changeEmail: "Change email",
    close: "Close",
  },
};

export default function LoginModal() {
  const { showLoginModal, closeLogin, refresh } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Detect language from URL
  const lang =
    typeof window !== "undefined" && window.location.pathname.startsWith("/en")
      ? "en"
      : "es";
  const t = texts[lang];

  // Reset when modal closes
  useEffect(() => {
    if (!showLoginModal) {
      setStep("email");
      setEmail("");
      setCode(["", "", "", "", "", ""]);
      setError("");
      setLoading(false);
    }
  }, [showLoginModal]);

  // Auto-focus first code input
  useEffect(() => {
    if (step === "code") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError(lang === "es" ? "Ingresa un email válido" : "Enter a valid email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep("code");
      } else if (res.status === 429) {
        setError(lang === "es" ? "Demasiados intentos. Espera un momento." : "Too many attempts. Wait a moment.");
      } else if (res.status >= 500) {
        setError(lang === "es" ? "Algo salió mal. Intenta de nuevo en unos minutos." : "Something went wrong. Try again in a few minutes.");
      } else {
        setError(data.error || "Error");
      }
    } catch {
      setError(lang === "es" ? "Error de conexión" : "Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newCode.every((d) => d !== "")) {
      verifyCode(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verifyCode(pasted);
    }
  };

  const verifyCode = async (fullCode: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: fullCode }),
      });
      const data = await res.json();
      if (data.ok) {
        await refresh();
        closeLogin();
      } else if (res.status >= 500) {
        setError(lang === "es" ? "Algo salió mal. Intenta de nuevo." : "Something went wrong. Try again.");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || "Código inválido");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError(lang === "es" ? "Error de conexión" : "Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError(lang === "es" ? "Ingresa los 6 dígitos" : "Enter all 6 digits");
      return;
    }
    verifyCode(fullCode);
  };

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeLogin}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        {/* Close button */}
        <button
          onClick={closeLogin}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
          aria-label={t.close}
        >
          ✕
        </button>

        {step === "email" && (
          <form onSubmit={handleSendCode}>
            <h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
            <p className="text-slate-400 text-sm mb-6">{t.subtitle}</p>

            <label className="block text-sm text-slate-300 mb-1.5">
              {t.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPh}
              autoFocus
              required
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-lg"
            />

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? t.sending : t.sendCode}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifySubmit}>
            <h2 className="text-2xl font-bold text-white mb-2">{t.codeTitle}</h2>
            <p className="text-slate-400 text-sm mb-1">{t.codeSub}</p>
            <p className="text-blue-400 text-sm font-medium mb-6">{email}</p>

            {/* 6-digit code inputs */}
            <div className="flex gap-2 justify-center mb-4" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? t.verifying : t.verify}
            </button>

            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
                className="text-sm text-slate-400 hover:text-white transition"
              >
                ← {t.changeEmail}
              </button>
              <button
                type="button"
                onClick={() => handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
                disabled={loading}
                className="text-sm text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
              >
                {t.resend}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
