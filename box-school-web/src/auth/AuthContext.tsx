import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as auth from "../services/auth";
import { getApiErrorMessage } from "../services/api";

export type Role = {
  id: number;
  key: string; // admin | student | cashier | trainer ...
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

const TOKEN_KEY = "token"; // ✅ token Sanctum (Bearer)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<auth.User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function clearAuth() {
    setUser(null);
    setRoles([]);
    localStorage.removeItem(TOKEN_KEY);
    // Si en tu app guardas user/roles, límpialos también (opcional)
    localStorage.removeItem("user");
    localStorage.removeItem("roles");
  }

  function setAuthPayload(payload: any) {
    setUser(payload?.user ?? null);
    setRoles(Array.isArray(payload?.roles) ? payload.roles : []);
  }

  async function refresh() {
    setError(null);

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // ✅ No hay token -> no intentamos /me (evita 401)
      setLoading(false);
      setUser(null);
      setRoles([]);
      return;
    }

    try {
      const payload = await auth.me(); // { user, roles }
      setAuthPayload(payload);

      // opcional: cache
      localStorage.setItem("user", JSON.stringify(payload.user ?? null));
      localStorage.setItem("roles", JSON.stringify(payload.roles ?? []));
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      const payload = await auth.login(email, password); // { token, user, roles }

      // ✅ Guardar token para que axios lo mande (Bearer)
      localStorage.setItem(TOKEN_KEY, payload.token);

      // opcional cache
      localStorage.setItem("user", JSON.stringify(payload.user ?? null));
      localStorage.setItem("roles", JSON.stringify(payload.roles ?? []));

      setAuthPayload(payload);
    } catch (e) {
      clearAuth();
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
      // si el token ya no existe, no pasa nada
      await auth.logout();
    } catch (e) {
      // aunque falle logout, igual limpiamos local
      setError(getApiErrorMessage(e));
    } finally {
      clearAuth();
      setLoading(false);
    }
  }

  useEffect(() => {
    // ✅ Si hay token -> intenta recuperar sesión con /me
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
