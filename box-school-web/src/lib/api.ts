// src/lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
  withCredentials: true, // Sanctum cookies
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});
