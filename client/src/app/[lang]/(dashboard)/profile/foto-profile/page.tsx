// src/app/profile/foto-profile/PhotoProfile.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui";
import { useMe } from "@/context/me";

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

  // Se cambia l'immagine nel contesto, sincronizza la UI
  useEffect(() => {
    setCurrentUrl(me?.profileImage ?? null);
  }, [me?.profileImage]);

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
    if (!file) return setError("Seleziona prima un'immagine.");
    if (!chefId) return setError("ID chef non disponibile (ancora non arrivato da /chefs/me).");

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const form = new FormData();
      form.append(PROFILE_UPLOAD_FIELD, file); // nome campo che il backend si aspetta

      const res = await api.post<UploadResponse>(
        `/api/chefs/${chefId}/profile/photo`,
        form,
        { validateStatus: () => true } // NON impostare Content-Type manualmente
      );

      if (res.status < 200 || res.status >= 300 || !res.data?.ok) {
        const msg = res.data?.message || `Upload fallito (${res.status}).`;
        throw new Error(msg);
      }

      // L'API ritorna un path relativo (/static/...), rendilo assoluto e fai cache-busting
      const rel = res.data.data?.profileImageUrl ?? null;
      if (rel) {
        const abs = toAbsolute(rel); // http://localhost:4000/static/...
        const busted = `${abs}${abs.includes("?") ? "&" : "?"}v=${Date.now()}`;
        setCurrentUrl(busted);
      }

      setSuccess(res.data.message ?? "Foto profilo aggiornata con successo.");
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Caricamento fallito. Per favore riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  const hasImage = Boolean(currentUrl);
  const mainBtnLabel = hasImage ? "Modifica la Foto Profilo" : "Carica Foto Profilo";

  return (
    <div className="min-h-dvh flex items-center justify-center bg-neutral-900 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 p-6 flex flex-col items-center gap-5">
        <h1 className="text-xl font-semibold">Foto Profilo</h1>

        <div className="relative h-28 w-28 rounded-full border border-neutral-700 overflow-hidden bg-neutral-800 flex items-center justify-center text-sm">
          {previewUrl ? (
            <img src={previewUrl} alt="Anteprima foto profilo" className="h-full w-full object-cover" />
          ) : hasImage ? (
            <img src={currentUrl!} alt="Foto profilo attuale" className="h-full w-full object-cover" />
          ) : (
            <span className="opacity-70">chef</span>
          )}
        </div>

        {/* opzionale: piccolo debug visivo */}
        <p className="text-xs text-neutral-500">Chef ID: {chefId ?? "— ancora no"}</p>
        {file && (
          <p className="text-xs text-neutral-400">
            {file.name} • {(file.size / 1024).toFixed(0)} KB
          </p>
        )}

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
          {loading ? "Caricamento..." : "Salva Foto"}
        </Button>

        {error && <p className="text-red-400 text-sm text-center whitespace-pre-line" role="alert">{error}</p>}
        {success && <p className="text-emerald-400 text-sm text-center" role="status">{success}</p>}
      </div>
    </div>
  );
}
