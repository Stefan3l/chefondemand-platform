// src/app/profile/foto-profile/PhotoProfile.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui";
import { useMe } from "@/context/me";
import { useTranslation } from "@/utils/useTranslation"; // ← presupunând hook-ul tău existent
import { Heading } from '@/components/ui';

/** Base URL dell'API per rendere assoluti i path /static/... */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const toAbsolute = (u: string) => (u.startsWith("http") ? u : `${API_BASE}${u}`);

const PROFILE_UPLOAD_FIELD = "photo"; // ⇠ backend: upload.single("photo")

type UploadResponse = {
  ok: boolean;
  message?: string;
  data?: { profileImageUrl?: string | null };
};

export default function PhotoProfile() {
  // traduceri
  const { t } = useTranslation("photoProfile");

  // ── Dati utente dal contesto (id + immagine corrente)
  const me = useMe();
  const chefId = me?.id ?? null;

  const [currentUrl, setCurrentUrl] = useState<string | null>(me?.profileImage ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // sincronizează când se schimbă imaginea în context
  useEffect(() => {
    setCurrentUrl(me?.profileImage ?? null);
  }, [me?.profileImage]);

  // auto-dismiss pentru mesaje (3s)
  useEffect(() => {
    if (!error && !success) return;
    const id = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
    return () => clearTimeout(id);
  }, [error, success]);

  // ── Selezione file
  function onPickFile() {
    setError(null);
    setSuccess(null);
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setSuccess(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  // ── Upload
  async function onUpload() {
    if (!file) return setError(t("messages.errors.noFile"));
    if (!chefId) return setError(t("messages.errors.noId"));

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const form = new FormData();
      form.append(PROFILE_UPLOAD_FIELD, file); // nume câmp așteptat de backend

      const res = await api.post<UploadResponse>(
        `/api/chefs/${chefId}/profile/photo`,
        form,
        { validateStatus: () => true } // NU seta Content-Type manual
      );

      if (res.status < 200 || res.status >= 300 || !res.data?.ok) {
        const msg = res.data?.message || `Upload failed (${res.status}).`;
        throw new Error(msg);
      }

      // API întoarce un path relativ (/static/...), îl facem absolut + cache-busting
      const rel = res.data.data?.profileImageUrl ?? null;
      if (rel) {
        const abs = toAbsolute(rel);
        const busted = `${abs}${abs.includes("?") ? "&" : "?"}v=${Date.now()}`;
        setCurrentUrl(busted);
      }

      setSuccess(res.data.message ?? t("messages.success"));
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("messages.errors.uploadFailed"));
    } finally {
      setLoading(false);
    }
  }

  const hasImage = Boolean(currentUrl);
  const mainBtnLabel = hasImage ? t("editButton") : t("uploadButton");

return (
  // full viewport, fără scrollbar
  <div className="min-h-dvh overflow-hidden bg-neutral-900 px-4 flex flex-col">
    {/* Header: titlu stânga + linie sub titlu */}
    <div className="py-4">
      <Heading level="h2">{t("pageTitle")}</Heading>
      <hr className="border-t border-[#C7AE6A33] mt-4" />
    </div>

    {/* Zona principală: cardul centrat pe pagină */}
    <div className="flex-1 grid place-items-center">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 p-6 flex flex-col items-center gap-5 hover:border-[#C7AE6A33] transition-colors">
        <h1 className="text-xl font-semibold">{t("title")}</h1>

        <div className="relative h-28 w-28 rounded-full border border-neutral-700 overflow-hidden bg-neutral-800 flex items-center justify-center text-sm">
          {previewUrl ? (
            <img src={previewUrl} alt={t("alt.preview")} className="h-full w-full object-cover" />
          ) : hasImage ? (
            <img src={currentUrl!} alt={t("alt.current")} className="h-full w-full object-cover" />
          ) : (
            <span className="opacity-70">{t("placeholder.noImage")}</span>
          )}
        </div>

        <Button type="button" onClick={onPickFile} disabled={loading} className="rounded-2xl px-4">
          {mainBtnLabel}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />

        <Button
          type="button"
          onClick={onUpload}
          disabled={loading || !file || !chefId}
          className="rounded-2xl px-4"
        >
          {loading ? t("loading") : t("saveButton")}
        </Button>

        {error && (
          <p className="text-red-400 text-sm text-center whitespace-pre-line" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-emerald-400 text-sm text-center" role="status">
            {success}
          </p>
        )}
      </div>
    </div>
  </div>
);

}
