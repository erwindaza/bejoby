"use client";

import { useState, useEffect, useCallback } from "react";
import EmployerRegisterForm from "@/components/EmployerRegisterForm";
import JobPostForm from "@/components/JobPostForm";

export default function EmpresasPage() {
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"register" | "post" | "jobs">("register");
  const [myJobs, setMyJobs] = useState<Array<{ id: string; title: string; status: string; created_at: string }>>([]);

  useEffect(() => {
    const saved = localStorage.getItem("bejoby_employer_id");
    if (saved) {
      setEmployerId(saved);
      setActiveTab("post");
    }
  }, []);

  const fetchMyJobs = useCallback(async () => {
    if (!employerId) return;
    try {
      const res = await fetch(`/api/jobs?employer_id=${employerId}`);
      const data = await res.json();
      if (data.ok) setMyJobs(data.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, [employerId]);

  useEffect(() => {
    if (employerId) fetchMyJobs();
  }, [employerId, fetchMyJobs]);

  return (
    <main className="min-h-screen pb-24">
      {/* Hero */}
      <section className="pt-28 pb-16 text-center bg-gradient-to-r from-indigo-700 to-purple-700 text-white px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Portal para Empresas
          </h1>
          <p className="text-lg text-indigo-100/90">
            Publica ofertas laborales, encuentra al mejor talento y gestiona tus procesos de selección.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-700 pb-3">
          {!employerId && (
            <button
              onClick={() => setActiveTab("register")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "register"
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              📝 Registrar empresa
            </button>
          )}
          {employerId && (
            <>
              <button
                onClick={() => setActiveTab("post")}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "post"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                ➕ Publicar oferta
              </button>
              <button
                onClick={() => { setActiveTab("jobs"); fetchMyJobs(); }}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "jobs"
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                📋 Mis ofertas ({myJobs.length})
              </button>
            </>
          )}
        </div>

        {/* Content */}
        {activeTab === "register" && !employerId && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Registra tu empresa
            </h2>
            <EmployerRegisterForm />
          </div>
        )}

        {activeTab === "post" && employerId && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Publicar nueva oferta laboral
            </h2>
            <JobPostForm
              employerId={employerId}
              onSuccess={fetchMyJobs}
            />
          </div>
        )}

        {activeTab === "jobs" && employerId && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Mis ofertas publicadas</h2>
            {myJobs.length === 0 ? (
              <p className="text-gray-400 text-center py-12">
                No has publicado ofertas aún.
              </p>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-5 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-white font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-400">
                        {job.created_at ? new Date(job.created_at).toLocaleDateString("es-CL") : ""}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === "published"
                        ? "bg-green-600/20 text-green-300"
                        : job.status === "draft"
                        ? "bg-yellow-600/20 text-yellow-300"
                        : "bg-gray-600/20 text-gray-300"
                    }`}>
                      {job.status === "published" ? "Publicada" : job.status === "draft" ? "Borrador" : "Cerrada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}