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
  // ✅ baseURL ya incluye /api -> aquí NO va /api
  const res = await api.post<ApiResponse<AuthPayload>>("/auth/login", { email, password });
  return res.data.data;
}

export async function me(): Promise<Omit<AuthPayload, "token">> {
  const res = await api.get<ApiResponse<Omit<AuthPayload, "token">>>("/auth/me");
  return res.data.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
