// src/services/api.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const TOKEN_KEY = "token";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const api = axios.create({
  baseURL,

  // ✅ puedes dejarlo true, pero token-based NO lo necesita
  // (no rompe nada si tu backend no usa cookies)
  withCredentials: true,

  // ✅ (si ya no usarás cookies, esto no afecta)
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",

  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  // ✅ 1) Bearer token (LO IMPORTANTE para /api/auth/me y rutas protegidas)
  const bearer = localStorage.getItem(TOKEN_KEY);
  if (bearer) {
    (config.headers as any).Authorization = `Bearer ${bearer}`;
  } else {
    delete (config.headers as any).Authorization;
  }

  // ✅ 2) XSRF (opcional; si ya no usas cookie-session, no estorba)
  const xsrf = getCookie("XSRF-TOKEN");
  if (xsrf) {
    (config.headers as any)["X-XSRF-TOKEN"] = xsrf;
  }

  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Error inesperado";

  if (!error.response) return "Sin respuesta del servidor (red / CORS / backend apagado)";

  const data = error.response.data as any;

  // tu backend a veces responde {success:false, message:"..."}
  return (
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : null) ||
    `Error HTTP ${error.response.status}`
  );
}
