"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Employer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  verification_status: "pending" | "verified" | "rejected";
  created_at?: { _seconds: number; _nanoseconds: number };
}

interface Job {
  id: string;
  title: string;
  description: string;
  location?: string;
  salary_range?: string;
  employment_type?: string;
  status: string;
  employer_id: string;
  created_at?: { _seconds: number; _nanoseconds: number };
}

export default function AdminEmployersPage() {
  const { locale } = useParams<{ locale: string }>();
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!savedToken) return;

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [empRes, jobsRes] = await Promise.all([
          fetch("/api/admin/employers", { headers: { authorization: `Bearer ${savedToken}` } }),
          fetch("/api/admin/jobs?status=pending_review", { headers: { authorization: `Bearer ${savedToken}` } }),
        ]);
        const empData = await empRes.json();
        const jobsData = await jobsRes.json();
        if (empData.ok) setEmployers(empData.data);
        else setError(empData.error || "Error cargando empleadores");
        if (jobsData.ok) setJobs(jobsData.data);
        else setError(jobsData.error || "Error cargando ofertas");
      } catch {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [savedToken]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [empRes, jobsRes] = await Promise.all([
        fetch("/api/admin/employers", { headers: { authorization: `Bearer ${savedToken}` } }),
        fetch("/api/admin/jobs?status=pending_review", { headers: { authorization: `Bearer ${savedToken}` } }),
      ]);
      const empData = await empRes.json();
      const jobsData = await jobsRes.json();
      if (empData.ok) setEmployers(empData.data);
      else setError(empData.error || "Error cargando empleadores");
      if (jobsData.ok) setJobs(jobsData.data);
      else setError(jobsData.error || "Error cargando ofertas");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function updateEmployer(id: string, status: Employer["verification_status"]) {
    setMessage("");
    try {
      const res = await fetch("/api/admin/employers", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${savedToken}` },
        body: JSON.stringify({ id, verification_status: status }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmployers((prev) =>
          prev.map((e) => (e.id === id ? { ...e, verification_status: status } : e))
        );
        setMessage("Empleador actualizado");
      } else {
        setError(data.error || "Error");
      }
    } catch {
      setError("Error de conexión");
    }
  }

  async function updateJob(id: string, status: Job["status"]) {
    setMessage("");
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${savedToken}` },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        setMessage("Oferta actualizada");
      } else {
        setError(data.error || "Error");
      }
    } catch {
      setError("Error de conexión");
    }
  }

  function formatDate(ts?: { _seconds: number }) {
    if (!ts) return "—";
    return new Date(ts._seconds * 1000).toLocaleString(locale === "en" ? "en-US" : "es-CL");
  }

  if (!savedToken) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-md mx-auto mt-20">
          <h1 className="text-2xl font-bold mb-4">Admin BeJoby</h1>
          <p className="text-slate-400 mb-4">Ingresa el token de administrador.</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token secreto"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg mb-4"
          />
          <button
            onClick={() => setSavedToken(token)}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin — Revisión de empleadores y ofertas</h1>
          <button onClick={loadData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm">
            Actualizar
          </button>
        </div>

        {loading && <p className="text-slate-400">Cargando...</p>}
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {message && <p className="text-green-400 mb-4">{message}</p>}

        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Ofertas pendientes de revisión ({jobs.length})</h2>
          {jobs.length === 0 && !loading && <p className="text-slate-500">No hay ofertas pendientes.</p>}
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                      <span>{job.location || "Sin ubicación"}</span>
                      <span>•</span>
                      <span>{job.employment_type}</span>
                      <span>•</span>
                      <span>{formatDate(job.created_at)}</span>
                      <span>•</span>
                      <span className="font-mono">{job.employer_id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateJob(job.id, "published")}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm font-medium"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => updateJob(job.id, "rejected")}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm font-medium"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Empleadores ({employers.length})</h2>
          {employers.length === 0 && !loading && <p className="text-slate-500">No hay empleadores registrados.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {employers.map((emp) => (
                  <tr key={emp.id} className="bg-slate-900/50">
                    <td className="p-3">
                      <div className="font-medium">{emp.company_name}</div>
                      <div className="text-xs text-slate-500">{emp.industry || "—"}</div>
                    </td>
                    <td className="p-3">{emp.contact_name}</td>
                    <td className="p-3">
                      <a href={`mailto:${emp.email}`} className="text-blue-400 hover:underline">
                        {emp.email}
                      </a>
                      {emp.website && (
                        <div>
                          <a href={emp.website} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                            {emp.website}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.verification_status === "verified"
                            ? "bg-green-900/30 text-green-400"
                            : emp.verification_status === "rejected"
                            ? "bg-red-900/30 text-red-400"
                            : "bg-yellow-900/30 text-yellow-400"
                        }`}
                      >
                        {emp.verification_status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{formatDate(emp.created_at)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateEmployer(emp.id, "verified")}
                          disabled={emp.verification_status === "verified"}
                          className="px-2 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded text-xs"
                        >
                          Verificar
                        </button>
                        <button
                          onClick={() => updateEmployer(emp.id, "rejected")}
                          disabled={emp.verification_status === "rejected"}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 rounded text-xs"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
