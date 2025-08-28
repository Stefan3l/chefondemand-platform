// src/lib/axios.ts
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

export const API_BASE =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Interceptor pentru token (din localStorage)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("loggedUser");
      const token = raw ? (JSON.parse(raw) as { token?: string })?.token : undefined;

      if (token) {
        // Normalizează headers la AxiosHeaders și setează Authorization
        const headers = new AxiosHeaders(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
      }
    } catch {
      // ignore
    }
  }
  return config;
});
