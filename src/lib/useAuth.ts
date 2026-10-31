"use client";

import { useEffect, useState, useCallback } from "react";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
};

// Lightweight client auth state backed by GET /api/auth/me (HTTP-only cookie).
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = await res.json();
      setUser(json?.data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return { user, loading, refresh, logout, isAdmin: user?.role === "ADMIN" };
}
