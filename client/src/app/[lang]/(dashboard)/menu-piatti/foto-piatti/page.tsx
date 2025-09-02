// src/app/profile/foto-piatti/FotoPiatti.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { api } from "@/lib/axios";
import { Button, Heading, Paragraph } from "@/components/ui";
import { useMe } from "@/context/me";
import { useTranslation } from "@/utils/useTranslation";
import { Plus, X } from "lucide-react";

/* ====================== Config & tipi ====================== */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function withApiBase(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
        const base = new URL(API_BASE);
        return `${base.origin}${u.pathname}${u.search}${u.hash}`;
      }
      return url;
    } catch {
      /* fall back a relativo */
    }
  }
  const base = API_BASE.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

/**
 * Costruisce la src: preferisce imageUrl, altrimenti deriva da imagePath
 */
function photoSrc(p: DishPhoto): string {
  const fallbackFromPath = p.imagePath
    ? `/static/${String(p.imagePath).replace(/^\/*/, "")}`
    : "";
  const rel = p.imageUrl || fallbackFromPath;
  return withApiBase(rel);
}

const DISH_UPLOAD_FIELD = "file";

type ApiListResponse<T> = { ok: true; data: T };
type ApiCreateResponse<T> = { ok: true; data: T };
type ApiDeleteResponse = void | { ok: true };

type DishPhoto = {
  id: string;
  chefId: string;
  imageUrl?: string | null;
  imagePath?: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function FotoPiatti() {
  const { t } = useTranslation("dishPhotos");
  const me = useMe();

  const chefId = me?.id ?? null;

  /* ====================== Stato lista / UI ====================== */

  const [photos, setPhotos] = useState<DishPhoto[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);

  const [file, setFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [appliedPreview, setAppliedPreview] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");

  const [crop, setCrop] = useState<Crop>({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [busyUpload, setBusyUpload] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyDelete, setBusyDelete] = useState<boolean>(false);

  // Lightbox: immagine a grandezza naturale + CHIUDI
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  /* ====================== Helpers ====================== */

  const loadPhotos = useCallback(async () => {
    if (!chefId) return;
    setLoadingList(true);
    try {
      const res = await api.get<ApiListResponse<DishPhoto[]>>(`/api/chefs/${chefId}/dish-photos`, {
        validateStatus: () => true,
      });
      if (res.status === 200 && res.data?.data) {
        setPhotos(res.data.data);
      } else {
        setError("Impossibile caricare le foto.");
      }
    } catch {
      setError("Impossibile caricare le foto.");
    } finally {
      setLoadingList(false);
    }
  }, [chefId]);

  const resetPicker = () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (appliedPreview) URL.revokeObjectURL(appliedPreview);
    setOriginalPreview(null);
    setAppliedPreview(null);
    setFile(null);
    setDescription("");
    setCrop({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
  };

  useEffect(() => {
    if (!error && !success) return;
    const id = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
    return () => clearTimeout(id);
  }, [error, success]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  /* ====================== Selezione & Crop ====================== */

  const inputRef = useRef<HTMLInputElement | null>(null);
  const onPickFile = () => {
    setError(null);
    setSuccess(null);
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;

    if (appliedPreview) URL.revokeObjectURL(appliedPreview);
    setAppliedPreview(null);

    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(f ? URL.createObjectURL(f) : null);

    setFile(null);
    setDescription("");
    setCrop({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;

    const displayW = img.width;
    const displayH = img.height;
    const cw = Math.round(displayW * 0.8);
    const ch = Math.round(displayH * 0.8);
    const cx = Math.round((displayW - cw) / 2);
    const cy = Math.round((displayH - ch) / 2);
    setCrop({ unit: "px", x: cx, y: cy, width: cw, height: ch });
  };

  async function getCroppedBlob(image: HTMLImageElement, cropRect: Crop): Promise<Blob> {
    const w = Math.floor(cropRect.width ?? 0);
    const h = Math.floor(cropRect.height ?? 0);
    if (w <= 0 || h <= 0) throw new Error(t("messages.errors.cropInvalid"));

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
    if (!ctx) throw new Error(t("messages.errors.canvas"));

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve((b as Blob) ?? new Blob()), "image/jpeg", 0.92)
    );
    return blob;
  }

  const onApplyCrop = async () => {
    if (!imgRef.current) return;
    try {
      const blob = await getCroppedBlob(imgRef.current, crop);
      const cropped = new File([blob], "dish-cropped.jpg", { type: "image/jpeg" });

      if (appliedPreview) URL.revokeObjectURL(appliedPreview);
      const prev = URL.createObjectURL(cropped);
      setAppliedPreview(prev);
      setFile(cropped);
      setSuccess(t("messages.readyToUpload"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("messages.errors.uploadFailed"));
    }
  };

  const onCancelCrop = () => resetPicker();

  /* ====================== Upload & Delete ====================== */

  const onUpload = async () => {
    if (!file) return setError(t("messages.errors.noFile"));
    if (!chefId) return setError(t("messages.errors.noId"));

    setBusyUpload(true);
    setError(null);
    setSuccess(null);

    try {
      const form = new FormData();
      form.append(DISH_UPLOAD_FIELD, file);
      if (description.trim()) form.append("description", description.trim());

      const res = await api.post<ApiCreateResponse<DishPhoto>>(
        `/api/chefs/${chefId}/dish-photos/upload`,
        form,
        { validateStatus: () => true }
      );

      if (res.status !== 201 || !res.data?.data) {
        throw new Error(t("messages.errors.uploadFailed"));
      }

      setSuccess(t("messages.uploadOk"));
      await loadPhotos();
      resetPicker();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("messages.errors.uploadFailed"));
    } finally {
      setBusyUpload(false);
    }
  };

  const askDelete = (photoId: string) => setDeleteId(photoId);
  const closeDelete = () => setDeleteId(null);

  const confirmDelete = async () => {
    if (!deleteId || !chefId) return;
    setBusyDelete(true);
    try {
      const res = await api.delete<ApiDeleteResponse>(
        `/api/chefs/${chefId}/dish-photos/${deleteId}`,
        { validateStatus: () => true }
      );
      if (res.status !== 204) throw new Error(t("messages.errors.deleteFailed"));

      setSuccess(t("messages.deleteOk"));
      setDeleteId(null);
      await loadPhotos();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("messages.errors.deleteFailed"));
    } finally {
      setBusyDelete(false);
    }
  };

  // Griglia immagini: bottone X in alto a destra, sopra l'immagine, sempre visibile
  const grid = useMemo(() => {
    return (
      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-2">
        {photos.map((p) => {
          const src = photoSrc(p);
          const alt = p.description || "dish photo";
          return (
            <li key={p.id} className="relative">
              <div
                className="relative aspect-square w-full max-w-[80px] md:max-w-[100px] lg:max-w-[180px] mx-auto overflow-hidden rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => setLightbox({ src, alt })}
                  className="absolute inset-0 cursor-zoom-in"
                  aria-label={alt}
                  title={alt}
                />
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-cover object-center pointer-events-none select-none"
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 180px"
                  loading="lazy"
                  unoptimized
                  draggable={false}
                />
                <button
                  type="button"
                  aria-label={t("delete.open")}
                  onClick={(e) => { e.stopPropagation(); askDelete(p.id); }}
                  className="absolute top-2 right-2 z-10 inline-flex h-5 w-5 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-black/70 border border-neutral-700"
                  title={t("delete.open")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {p.description && (
                <Paragraph size="sm" className="mt-2 lg:mt-4 text-secondary line-clamp-2 text-center">{p.description}</Paragraph>
              )}
            </li>
          );
        })}
      </ul>
    );
  }, [photos, t]);

  // Chiudi lightbox con ESC
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <div className="min-h-dvh bg-neutral-900 text-neutral-100 px-4 flex flex-col border border-neutral-800 rounded-xl hover:border-[#C7AE6A33]">
      <div className="py-6">
        <Heading level="h2" className="text-xl font-semibold tracking-wide">
          {t("pageTitle")}
        </Heading>
        <hr className="border-t border-[#C7AE6A33] mt-4" />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={() => (document.activeElement as HTMLElement | null)?.blur() || onPickFile()}
          className="inline-flex items-center gap-2 h-11 px-5"
          disabled={!chefId}
          title={!chefId ? "Not authenticated" : undefined}
        >
          <span className="flex items-center gap-2">
            <Plus strokeWidth={3} />
            {t("addButton")}
          </span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {originalPreview && (
        <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-[0_0_0_1px_rgba(199,174,106,0.07)]">
          <Heading level="h3" className="font-medium mb-3 text-[#C7AE6A]">{t("crop.title")}</Heading>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="rounded-xl overflow-hidden border border-neutral-800 inline-block bg-transparent w-full max-w-[92vw] lg:max-w-[700px]">
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} keepSelection className="block w-full">
                <img
                  src={originalPreview}
                  alt={t("alt.preview")}
                  onLoad={onImageLoad}
                  className="block w-full h-auto max-h-[70vh]"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            <div className="min-w-[250px] max-w-sm mx-auto lg:mx-0 flex flex-col gap-4">
              <label className="text-sm">
                {t("description.label")}
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("description.placeholder")}
                  className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A] focus:ring-1 focus:ring-[#C7AE6A]"
                />
              </label>

              <div className="flex items-center gap-3">
                <Button onClick={onCancelCrop} variant="secondary" className="h-11 px-5">
                  {t("crop.cancel")}
                </Button>
                <Button onClick={onApplyCrop} className="h-11 px-5">
                  {t("crop.apply")}
                </Button>
                <Button
                  onClick={onUpload}
                  variant="primary"
                  className="h-11 px-5"
                  disabled={busyUpload || !file || !chefId}
                >
                  {busyUpload ? t("loading") : t("uploadButton")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(error || success) && (
        <div className="mb-6">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 text-sm">{success}</p>}
        </div>
      )}

      <div className="mb-10 mt-6">
        <Heading level="h3" className="font-semibold mb-8 text-[#C7AE6A]">{t("gallery.title")}</Heading>
        
        {loadingList ? (
          <p className="text-sm text-neutral-400">{t("gallery.loading")}</p>
        ) : photos.length === 0 ? (
          <p className="text-sm text-neutral-400">{t("gallery.empty")}</p>
        ) : (
          grid
        )}
      </div>

      {deleteId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeDelete}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#C7AE6A33] bg-neutral-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <Heading level="h4" className="text-lg font-semibold mb-2">{t("delete.title")}</Heading>
            <Paragraph size="base" className=" text-secondary mb-4">{t("delete.message")}</Paragraph>

            <div className="flex items-center justify-center gap-4">
              <Button variant="secondary" onClick={closeDelete} disabled={busyDelete}>
                {t("delete.cancel")}
              </Button>
              <Button onClick={confirmDelete} disabled={busyDelete}>
                {busyDelete ? t("loading") : t("delete.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox a schermo intero */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="max-w-[95vw] w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="mx-auto max-w-[95vw] max-h-[80vh] w-auto h-auto rounded-xl object-contain"
              draggable={false}
            />
            <div className="mt-4 lg:mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => setLightbox(null)}
                className="px-6"
              >
                {t('button.name')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
