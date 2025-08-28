// src/app/profile/foto-profile/PhotoProfile.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactCrop, { Crop } from "react-image-crop";
import Image from "next/image";
import { api } from "@/lib/axios";
import { Button, Heading } from "@/components/ui";
import { useMe } from "@/context/me";
import { useTranslation } from "@/utils/useTranslation";
import { Plus } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const toAbsolute = (u: string) => (u?.startsWith("http") ? u : `${API_BASE}${u}`);
const PROFILE_UPLOAD_FIELD = "photo";

type UploadResponse = {
  ok: boolean;
  message?: string;
  data?: { profileImageUrl?: string | null };
};

export default function PhotoProfile() {
  const { t } = useTranslation("photoProfile");
  const me = useMe();
  const chefId = me?.id ?? null;

  // Immagine attuale dal server
  const [currentUrl, setCurrentUrl] = useState<string | null>(me?.profileImage ?? null);

  // Anteprima "applicata" dopo il ritaglio (prima del salvataggio)
  const [appliedPreview, setAppliedPreview] = useState<string | null>(null);

  // File selezionato e sorgente per l'editor di crop
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Stato del crop
  const [crop, setCrop] = useState<Crop>({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Dimensiunile naturale ale imaginii pentru layout corect (crop shrink-to-fit)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  // UI e messaggi
  const [loading, setLoading] = useState(false);
  const [needsSave, setNeedsSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sincronizza l'immagine dal contesto se cambia
  useEffect(() => {
    setCurrentUrl(me?.profileImage ?? null);
  }, [me?.profileImage]);

  // Auto-dismiss dei messaggi (3s)
  useEffect(() => {
    if (!error && !success) return;
    const id = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
    return () => clearTimeout(id);
  }, [error, success]);

  // Selezione file
  function onPickFile() {
    setError(null);
    setSuccess(null);
    inputRef.current?.click();
  }

  // Cambio file: reset anteprime e stato "da salvare"
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;

    if (appliedPreview) URL.revokeObjectURL(appliedPreview);
    setAppliedPreview(null);
    setFile(null);

    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(f ? URL.createObjectURL(f) : null);

    setCrop({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
    setNeedsSave(false);
  }

  // Inizializza un crop elegante (80% centrato) + salvează dimensiunile naturale pt. layout
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    imgRef.current = img;

    // salvează dimensiunile naturale pentru Next/Image (layout corect, fără întindere)
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });

    const displayW = img.width;
    const displayH = img.height;
    const cw = Math.round(displayW * 0.8);
    const ch = Math.round(displayH * 0.8);
    const cx = Math.round((displayW - cw) / 2);
    const cy = Math.round((displayH - ch) / 2);
    setCrop({ unit: "px", x: cx, y: cy, width: cw, height: ch });
  }

  // Crea un Blob JPEG dal rettangolo di crop (coordinate in spazio naturale)
  async function getCroppedBlobFromCrop(image: HTMLImageElement, cropRect: Crop): Promise<Blob> {
    const w = Math.floor(cropRect.width ?? 0);
    const h = Math.floor(cropRect.height ?? 0);
    if (w <= 0 || h <= 0) throw new Error("Area di ritaglio non valida.");

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const sx = Math.max(0, Math.floor((cropRect.x ?? 0) * scaleX));
    const sy = Math.max(0, Math.floor((cropRect.y ?? 0) * scaleY));
    const sw = Math.min(image.naturalWidth - sx, Math.floor(w * scaleX));
    const sh = Math.min(image.naturalHeight - sy, Math.floor(h * scaleY));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, sw);
    canvas.height = Math.max(1, sh);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas non supportato.");

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve((b as Blob) ?? new Blob()), "image/jpeg", 0.92)
    );
    return blob;
  }

  // Applica il ritaglio e invita a salvare
  async function onApplyCrop() {
    if (!imgRef.current || !originalPreview) return;

    try {
      const blob = await getCroppedBlobFromCrop(imgRef.current, crop);
      const croppedFile = new File([blob], "profile-cropped.jpg", { type: "image/jpeg" });

      if (appliedPreview) URL.revokeObjectURL(appliedPreview);
      const nextPrev = URL.createObjectURL(croppedFile);
      setAppliedPreview(nextPrev);

      setFile(croppedFile);
      setNeedsSave(true); // attiva l'effetto "pulse" su Salva foto
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("messages.errors.uploadFailed");
      setError(msg);
    }
  }

  // Annulla la sessione di crop corrente
  function onCancelCrop() {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(null);
  }

  // Upload su server
  async function onUpload() {
    if (!file) return setError(t("messages.errors.noFile"));
    if (!chefId) return setError(t("messages.errors.noId"));

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const form = new FormData();
      form.append(PROFILE_UPLOAD_FIELD, file);

      const res = await api.post<UploadResponse>(
        `/api/chefs/${chefId}/profile/photo`,
        form,
        { validateStatus: () => true }
      );

      if (res.status < 200 || res.status >= 300 || !res.data?.ok) {
        const msg = res.data?.message || `Upload fallito (${res.status}).`;
        throw new Error(msg);
      }

      const rel = res.data.data?.profileImageUrl ?? null;
      if (rel) {
        const abs = toAbsolute(rel);
        const busted = `${abs}${abs.includes("?") ? "&" : "?"}v=${Date.now()}`;
        setCurrentUrl(busted);
      }

      setSuccess(res.data.message ?? t("messages.success"));

      // Pulizia locale e rimozione evidenziazione
      setNeedsSave(false);
      setFile(null);
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      setOriginalPreview(null);
      if (appliedPreview) {
        URL.revokeObjectURL(appliedPreview);
        setAppliedPreview(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("messages.errors.uploadFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Sorgente mostrata nel pannello sinistro
  const leftImage = appliedPreview || currentUrl || null;
  const hasSaved = Boolean(currentUrl);
  const mainBtnLabel = hasSaved ? t("editButton") : t("uploadButton");

  // Stato evidenziato per "Salva foto"
  const saveEmphasis = needsSave
    ? "ring-2 ring-[#C7AE6A] text-[#C7AE6A] animate-pulse shadow-[0_0_0_3px_rgba(199,174,106,0.25)]"
    : "";

  return (
    <div className="min-h-dvh bg-neutral-900 text-neutral-100 px-4 flex flex-col border border-neutral-800 rounded-xl hover:border-[#C7AE6A33] overflow-x-hidden">
      {/* Header elegante, allineato a sinistra */}
      <div className="py-6">
        <Heading level="h2" className="text-xl font-semibold tracking-wide">
          {t("pageTitle")}
        </Heading>
        <hr className="border-t border-[#C7AE6A33] mt-4" />
      </div>

      {/* Layout a due colonne, responsive; preveniamo overflow orizzontale */}
      <div className="flex-1 grid grid-cols-12 gap-6 sm:gap-8 max-w-full">
        {/* SINISTRA – immagine + bottoni nello stesso contenitore */}
        <section className="col-span-12  xl:col-span-5 min-w-0">
  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_0_1px_rgba(199,174,106,0.07)]">
    <h3 className="text-base font-medium mb-3 text-[#C7AE6A] text-center xl:text-start ml-2">
      {leftImage ? t("title") : t("placeholder.addProfilePhoto")}
    </h3>

    <div className="flex flex-col xl:flex-row items-stretch gap-5">
      <div className="rounded-2xl bg-neutral-900/50 p-2 flex flex-col items-center justify-center">
        {leftImage ? (
          <Image
            width={200}
            height={200}
            src={leftImage}
            alt={appliedPreview ? t("alt.preview") : t("alt.current")}
            className="block w-full max-w-[280px] h-auto max-h-[60dvh] object-contain rounded-xl"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className="flex items-center justify-center w-42 h-42 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition cursor-pointer"
              onClick={onPickFile}
            >
              <Plus className="w-12 h-12" />
            </div>
          </div>
        )}
      </div>

      <div className="md:min-w[220px] flex flex-col justify-center mx-auto">
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="primary"
            onClick={onPickFile}
            disabled={loading}
            className="inline-flex h-11 px-5 items-center justify-center text-center leading-tight"
          >
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
            variant="secondary"
            type="button"
            onClick={onUpload}
            disabled={loading || !file || !chefId}
            className={`inline-flex h-11 px-5 items-center justify-center text-center leading-tight lg:text-base ${saveEmphasis}`}
          >
            {loading ? t("loading") : t("saveButton")}
          </Button>

          {/* Messaggi sotto ai bottoni */}
          {error && (
            <p className="text-red-400 text-sm text-center" role="alert">
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
  </div>
</section>


       {/* DESTRA – editor di crop (shrink-to-fit, fără banda neagră) */}
        <section className="col-span-12  xl:col-span-7 min-w-0 mb-20 lg:mb-0">
          {originalPreview && (
            <div className="mt-1">
              {/* Container strict cât imaginea */}
           <div className="rounded-xl overflow-hidden border border-neutral-800 inline-block bg-transparent w-full max-w-[92vw] lg:max-w-[700px]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                keepSelection
                className="block w-full"
              >
                <img
                  src={originalPreview}
                  alt={t("alt.preview")}
                  onLoad={onImageLoad}
                  className="block w-full h-auto max-h-[80vh]"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>



              {/* Azioni crop */}
              <div className="flex items-center justify-center gap-5 lg:justify-start mt-4">
                <Button onClick={onCancelCrop} variant="secondary" className="inline-flex h-11 px-5 items-center justify-center">
                  {t("crop.cancel")}
                </Button>
                <Button
                  onClick={onApplyCrop}
                  variant="primary"
                  className="inline-flex h-11 px-5 items-center justify-center"
                >
                  {t("crop.confirm")}
                </Button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
