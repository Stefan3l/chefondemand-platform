"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/axios";
import axios from "axios";
import { useTranslation } from "@/utils/useTranslation";
import { X } from "lucide-react";
import { Heading } from "@/components/ui";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginChefModal({ open, onClose }: Props) {
  const { t } = useTranslation("login");
  const router = useRouter();
  const pathname = usePathname();
  const lang = (pathname?.split("/")[1] || "en") as "en" | "it";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  if (!open) return null;

  const validate = (): string | null => {
    if (!email.trim()) return t("errors.required_email");
    if (!/^\S+@\S+\.\S+$/.test(email)) return t("errors.invalid_email");
    if (!password.trim()) return t("errors.required_password");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);

    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }

    try {
      setLoading(true);

      // fac login (ex: {token, name, email})
      const res = await api.post("/api/chef/login", { email, password });

      // 👉 salvăm datele utile în localStorage
      //    (poți salva și token-ul sau id-ul dacă vrei)
      localStorage.setItem(
        "loggedUser",
        JSON.stringify({
          name: res.data.firstName, // presupun că backend-ul returnează un câmp "name"
          email: res.data.email,
          token: res.data.token,
        })
      );

      if (remember) {
        localStorage.setItem("cod_email_hint", email);
      } else {
        localStorage.removeItem("cod_email_hint");
      }

      router.push(`/${lang}/dashboard`);
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiMsg = (err.response?.data as { error?: string } | undefined)?.error;
        setErrMsg(
          apiMsg && apiMsg.toLowerCase().includes("invalid")
            ? t("errors.invalid_credentials")
            : t("errors.server_error")
        );
      } else {
        setErrMsg(t("errors.server_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-md mx-4 sm:mx-6 rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 max-h-[90vh] overflow-y-auto p-5 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          aria-label={t("close")}
        >
          <X size={16} />
        </button>

        <div className="text-center mb-4">
          <Heading level="h3" className="text-2xl font-semibold text-[#C7AE6A]">
            {t("title")}
          </Heading>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm text-neutral-300">
                {t("email_label")}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-[#C7AE6A] focus:border-transparent"
                placeholder={t("email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm text-neutral-300">
                {t("password_label")}
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-[#C7AE6A] focus:border-transparent"
                placeholder={t("password_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <label htmlFor="login-remember" className="flex cursor-pointer select-none items-center gap-3 text-sm text-neutral-300">
              <input id="login-remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer sr-only" />
              <span className="relative inline-flex h-5 w-5 items-center justify-center rounded border border-neutral-600 bg-neutral-800 transition-colors peer-checked:bg-[#C7AE6A]">
                <svg viewBox="0 0 20 20" className="pointer-events-none absolute h-3.5 w-3.5 opacity-0 transition-opacity peer-checked:opacity-100">
                  <path d="M5 10.5l3 3 7-7" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{t("remember")}</span>
            </label>

            {errMsg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {errMsg}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-200 transition hover:bg-neutral-700">
              {t("cancel")}
            </button>
            <button type="submit" disabled={loading} className="flex-1 h-11 rounded-2xl bg-[#C7AE6A] px-4 py-2.5 font-semibold text-neutral-900 transition hover:brightness-95 disabled:opacity-60">
              {loading ? t("submitting") : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
