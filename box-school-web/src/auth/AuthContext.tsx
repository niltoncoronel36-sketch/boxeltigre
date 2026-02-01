import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as auth from "../services/auth";
import { getApiErrorMessage } from "../services/api";

export type Role = {
  id: number;
  key: string;   // admin | student | cashier | trainer ...
  name: string;
};

type AuthState = {
  user: auth.User | null;
  roles: Role[];
  loading: boolean;
  error: string | null;

  isAdmin: boolean;
  isStudent: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// ✅ Flag para evitar llamar /me si sabemos que NO hay sesión
const AUTH_FLAG = "has_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<auth.User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function setAuthPayload(payload: any) {
    setUser(payload?.user ?? null);
    setRoles(Array.isArray(payload?.roles) ? payload.roles : []);
  }

  async function refresh() {
    setError(null);

    try {
      const payload = await auth.me(); // { user, roles }
      setAuthPayload(payload);
      localStorage.setItem(AUTH_FLAG, "1");
    } catch {
      setUser(null);
      setRoles([]);
      localStorage.removeItem(AUTH_FLAG);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      const payload = await auth.login(email, password); // { user, roles }
      setAuthPayload(payload);
      localStorage.setItem(AUTH_FLAG, "1");
    } catch (e) {
      setUser(null);
      setRoles([]);
      localStorage.removeItem(AUTH_FLAG);
      setError(getApiErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setError(null);
    setLoading(true);

    try {
      await auth.logout();
      setUser(null);
      setRoles([]);
      localStorage.removeItem(AUTH_FLAG);
    } catch (e) {
      setError(getApiErrorMessage(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // ✅ Si nunca hubo sesión, no llamamos /me (evita 401 en consola)
    const hasSession = localStorage.getItem(AUTH_FLAG) === "1";
    if (!hasSession) {
      setLoading(false);
      return;
    }

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = roles.some((r) => r.key === "admin");
  const isStudent = roles.some((r) => r.key === "student");

  const value = useMemo<AuthState>(
    () => ({
      user,
      roles,
      loading,
      error,
      isAdmin,
      isStudent,
      signIn,
      signOut,
      refresh,
    }),
    [user, roles, loading, error, isAdmin, isStudent]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
