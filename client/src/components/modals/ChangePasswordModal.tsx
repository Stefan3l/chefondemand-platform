// src/components/modals/ChangePasswordModal.tsx
"use client";

import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/utils/useTranslation";
import { api } from "@/lib/axios";
import { Heading } from "@/components/ui";
import axios from "axios";

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,72}$/;

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ChangePasswordModal({ open, onClose }: Props) {
  const { t } = useTranslation("changePassword");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  if (!open) return null;

  const validate = (): string | null => {
    if (!oldPassword.trim()) return t("errors.required_old");
    if (!newPassword.trim()) return t("errors.required_new");
    if (!PASSWORD_RE.test(newPassword)) return t("errors.policy");
    if (newPassword === oldPassword) return t("errors.same_as_old");
    return null;
  };

  const canSubmit =
    !!oldPassword.trim() &&
    !!newPassword.trim() &&
    newPassword !== oldPassword &&
    PASSWORD_RE.test(newPassword) &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setOkMsg(null);

    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }

    try {
      setLoading(true);

      await api.put(
        "/api/chefs/change-password",
        { oldPassword, newPassword },
        { withCredentials: true }
      );

      setOkMsg(`${t("messages.successTitle")}: ${t("messages.successBody")}`);
      setTimeout(() => {
        setOldPassword("");
        setNewPassword("");
        onClose();
      }, 900);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiMsg = (err.response?.data as { error?: string } | undefined)?.error;
        setErrMsg(apiMsg ?? t("errors.server_error"));
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
          aria-label={t("actions.close")}
        >
          <X size={16} />
        </button>

        <div className="text-center mb-4">
          <Heading level="h3" className="text-2xl font-semibold text-[#C7AE6A]">
            {t("title")}
          </Heading>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label htmlFor="old-password" className="mb-1 block text-sm text-neutral-300">
              {t("old.label")}
            </label>
            <div className="relative">
              <input
                id="old-password"
                type={showOld ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-[#C7AE6A] focus:border-transparent pr-10"
                placeholder={t("old.placeholder")}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowOld((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                aria-label={showOld ? t("actions.hide") : t("actions.show")}
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm text-neutral-300">
              {t("new.label")}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-[#C7AE6A] focus:border-transparent pr-10"
                placeholder={t("new.placeholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                aria-label={showNew ? t("actions.hide") : t("actions.show")}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-400">{t("new.hint")}</p>
          </div>

          {/* Alerts */}
          {errMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {errMsg}
            </div>
          )}
          {okMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              {okMsg}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-neutral-200 transition hover:bg-neutral-700"
            >
              {t("actions.close")}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-11 rounded-2xl bg-[#C7AE6A] px-4 py-2.5 font-semibold text-neutral-900 transition hover:brightness-95 disabled:opacity-60"
            >
              {loading ? t("actions.submitting") : t("actions.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
