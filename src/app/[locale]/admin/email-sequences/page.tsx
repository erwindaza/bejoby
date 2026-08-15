// src/app/[locale]/admin/email-sequences/page.tsx — Email sequence management for admins
"use client";

import { useState, useEffect } from "react";
import { Plus, Play } from "lucide-react";

interface EmailSequence {
  id: string;
  to_email: string;
  to_name: string;
  to_company: string;
  current_step: number;
  status: "active" | "completed" | "unsubscribed";
  scheduled_next: string | null;
  steps_sent: { step: number; sent_at: string }[];
  created_at: string;
}

export default function EmailSequencesAdmin() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({ to_email: "", to_name: "", to_company: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || "";

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-sequences", {
        headers: { "x-admin-secret": adminSecret },
      });
      if (res.ok) {
        const data = await res.json();
        setSequences(data.sequences || []);
      }
    } catch (err) {
      console.error("Error loading sequences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/admin/email-sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ to_email: "", to_name: "", to_company: "" });
        setShowForm(false);
        await loadSequences();
      } else {
        const error = await res.json();
        setFormError(error.error || "Error creating sequence");
      }
    } catch {
      setFormError("Network error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/email-sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({ action: "process" }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Procesadas ${data.processed} secuencias. Errores: ${data.errors}`);
        await loadSequences();
      }
    } catch {
      alert("Error processing sequences");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      active: "bg-blue-900/30 text-blue-300 border border-blue-500/30",
      completed: "bg-green-900/30 text-green-300 border border-green-500/30",
      unsubscribed: "bg-red-900/30 text-red-300 border border-red-500/30",
    };
    return classes[status] || classes.active;
  };

  const getStepLabel = (step: number) => {
    const steps = ["Presentación", "Valor", "CTA"];
    return steps[step] || `Paso ${step}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Secuencias de Email</h1>
            <p className="text-slate-400">Gestiona tus campañas de outreach a RRHH</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleProcess}
              disabled={processing || sequences.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg font-medium transition"
            >
              <Play className="w-4 h-4" />
              {processing ? "Procesando..." : "Procesar pendientes"}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Agregar contacto
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Nuevo contacto RRHH</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.to_email}
                  onChange={(e) => setFormData({ ...formData, to_email: e.target.value })}
                  required
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.to_name}
                  onChange={(e) => setFormData({ ...formData, to_name: e.target.value })}
                  required
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Empresa"
                  value={formData.to_company}
                  onChange={(e) => setFormData({ ...formData, to_company: e.target.value })}
                  required
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium transition"
                >
                  {formLoading ? "Creando..." : "Crear y enviar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-600 hover:border-slate-500 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">Cargando secuencias...</div>
        ) : sequences.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400 mb-4">No hay secuencias aún.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
            >
              Crear primera secuencia
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-slate-800/50 border border-slate-700 rounded-xl">
            <table className="w-full">
              <thead className="bg-slate-700/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Empresa</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Paso</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Próximo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Enviados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sequences.map((seq) => (
                  <tr key={seq.id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-3 text-sm">{seq.to_email}</td>
                    <td className="px-6 py-3 text-sm">{seq.to_name}</td>
                    <td className="px-6 py-3 text-sm">{seq.to_company}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(seq.status)}`}>
                        {seq.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">{getStepLabel(seq.current_step)}</td>
                    <td className="px-6 py-3 text-sm text-slate-400">
                      {seq.scheduled_next ? new Date(seq.scheduled_next).toLocaleDateString("es-ES") : "—"}
                    </td>
                    <td className="px-6 py-3 text-sm">{seq.steps_sent.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 text-slate-400 text-sm">
          <p>
            💡 <strong>Tip:</strong> Haz clic en &quot;Procesar pendientes&quot; para enviar los emails de las secuencias que están listos.
          </p>
        </div>
      </div>
    </div>
  );
}
