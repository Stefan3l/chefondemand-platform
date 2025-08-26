// src/lib/axios.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  withCredentials: true,
});

//  Interceptor pentru injectarea tokenului din localStorage.
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('loggedUser');
    if (raw) {
      const parsed = JSON.parse(raw) as { token?: string };
      if (parsed && parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});
