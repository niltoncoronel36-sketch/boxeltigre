import { api } from "./api";

export type Role = {
  id: number;
  key: string;   // admin | student | cashier | trainer ...
  name: string;
};

export type User = {
  id: number;
  name: string;
  email: string; // en tu caso puede ser DNI
};

export type AuthPayload = {
  user: User;
  roles: Role[];
};

export async function csrfCookie(): Promise<void> {
  await api.get("/sanctum/csrf-cookie");
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  await csrfCookie();
  const res = await api.post<AuthPayload>("/api/auth/login", { email, password });
  return res.data;
}

export async function me(): Promise<AuthPayload> {
  const res = await api.get<AuthPayload>("/api/auth/me");
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}
