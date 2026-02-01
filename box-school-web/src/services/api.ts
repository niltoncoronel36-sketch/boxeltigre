// src/services/api.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const api = axios.create({
  baseURL,
  withCredentials: true,

  // ✅ Sanctum / Laravel XSRF
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",

  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// ✅ Fuerza X-XSRF-TOKEN aunque Axios no lo ponga por alguna razón
api.interceptors.request.use((config) => {
  const token = getCookie("XSRF-TOKEN");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any)["X-XSRF-TOKEN"] = token;
  }
  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Error inesperado";

  // ✅ cuando no hay response: red/CORS/backend caído
  if (!error.response) return "Sin respuesta del servidor (red / CORS / backend apagado)";

  const data = error.response.data as any;
  return (
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : null) ||
    `Error HTTP ${error.response.status}`
  );
}
