// src/components/AuthProvider.tsx — Global auth context
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
  user_id: string;
  email: string;
  employer_id: string | null;
  candidate_id?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  openLogin: () => void;
  closeLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
  showLoginModal: false,
  openLogin: () => {},
  closeLogin: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.ok ? data.data : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const openLogin = useCallback(() => setShowLoginModal(true), []);
  const closeLogin = useCallback(() => setShowLoginModal(false), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Sync candidate applications after login if candidate_id not yet linked
  useEffect(() => {
    if (user && !user.employer_id && !user.candidate_id) {
      fetch("/api/candidates/sync-applications", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.synced) {
            console.log("[SYNC-SUCCESS] Candidate profile linked");
            refresh();
          }
        })
        .catch((err) => console.log("[SYNC-ERROR]", err));
    }
  }, [user, refresh]);

  return (
    <AuthContext.Provider
      value={{ user, loading, refresh, logout, showLoginModal, openLogin, closeLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
