// src/services/api.ts
import axios from "axios";

// ✅ IMPORTANTE:
// Si baseURL termina en /api, entonces en tus requests NO pongas "/api/...."
// Ej: api.get("/categories")  ✅
//     api.get("/api/categories") ❌ (haría /api/api/categories)
const baseURL = String(
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");

const TOKEN_KEY = "token";

// (Opcional) Solo útil si más adelante usas cookies + CSRF (Sanctum SPA)
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ✅ Normaliza rutas para evitar /api/api y // duplicados
function normalizeUrl(url?: string) {
  if (!url) return url;

  // Si llega absoluta (http...), no tocar
  if (/^https?:\/\//i.test(url)) return url;

  let u = url.trim();

  // Asegura 1 slash al inicio
  if (!u.startsWith("/")) u = `/${u}`;

  // Si baseURL ya incluye /api y el request también empieza con /api, lo quitamos
  if (baseURL.endsWith("/api") && u.startsWith("/api/")) {
    u = u.replace(/^\/api(?=\/)/, "");
  }

  // Evita dobles slashes (menos el "http://")
  u = u.replace(/\/{2,}/g, "/");

  return u;
}

export const api = axios.create({
  baseURL,

  // ✅ Con Bearer token NO necesitas cookies
  withCredentials: false,

  // ✅ Solo aplica cuando withCredentials=true y Sanctum usa XSRF-TOKEN
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

  // ✅ 0) Normaliza URL (arregla /api/api automáticamente)
  const originalUrl = config.url;
  config.url = normalizeUrl(config.url);

  // Log opcional cuando corrige
  if (originalUrl && config.url && originalUrl !== config.url) {
    console.warn("⚠️ Ruta corregida automáticamente:", originalUrl, "→", config.url);
  } else if (typeof config.url === "string" && config.url.startsWith("/api/") && baseURL.endsWith("/api")) {
    // Si alguien insiste en /api/ y por alguna razón no se corrigió arriba
    console.warn(
      "⚠️ Estás llamando una ruta que empieza con /api. " +
        "Tu baseURL ya incluye /api, así que usa la ruta sin /api:",
      config.url
    );
  }

  // ✅ 1) Bearer token
  const bearer = localStorage.getItem(TOKEN_KEY);
  if (bearer) (config.headers as any).Authorization = `Bearer ${bearer}`;
  else delete (config.headers as any).Authorization;

  // ✅ 2) CSRF (solo si algún día activas cookies + withCredentials=true)
  if (api.defaults.withCredentials) {
    const xsrf = getCookie("XSRF-TOKEN");
    if (xsrf) (config.headers as any)["X-XSRF-TOKEN"] = xsrf;
  }

  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Error inesperado";
  if (!error.response) return "Sin respuesta del servidor (red / CORS / backend apagado)";

  const data = error.response.data as any;
  return (
    data?.message ||
    data?.error ||
    (typeof data === "string" ? data : null) ||
    `Error HTTP ${error.response.status}`
  );
}
