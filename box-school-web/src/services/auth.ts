import { api } from "./api";

export type Role = {
  id: number;
  key: string; // admin | student | ...
  name: string;
};

export type User = {
  id: number;
  name: string;
  email: string; // o DNI si lo usas así
};

export type AuthPayload = {
  token: string;
  user: User;
  roles: Role[];
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export async function login(email: string, password: string): Promise<AuthPayload> {
  // ✅ YA NO se usa csrfCookie (eso era para sesiones/cookies)
  const res = await api.post<ApiResponse<AuthPayload>>("/api/auth/login", { email, password });

  // si tu backend lanza ValidationException, axios caerá en catch en el caller
  return res.data.data;
}

export async function me(): Promise<Omit<AuthPayload, "token">> {
  const res = await api.get<ApiResponse<Omit<AuthPayload, "token">>>("/api/auth/me");
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}
