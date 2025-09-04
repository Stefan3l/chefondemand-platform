"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/axios";
import { Button, Paragraph } from "@/components/ui";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  ImagePlus,
  MapPin,
  UtensilsCrossed,
  Sun,
  Flame,
  Fish,
  Leaf,
  Shuffle,
  Gift,
  ChevronDown,
  Check,
} from "lucide-react";
import ModalShell from "@/components/dashboard/menu-piatti/menu/ModalShell";
import SelectDishModal from "@/components/dashboard/menu-piatti/menu/SelectDishModal";

// —— crop ca la PhotoProfile ——
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// ───────────────────── Tipi dominio (coerenti con backend) ─────────────────────
type MenuBalance = "GUSTOSA" | "EQUILIBRATO" | "LEGGERA";
type CuisineType =
  | "LOCALE"
  | "GIAPPONESE"
  | "MEDITERRANEO"
  | "BBQ"
  | "FRUTTI_DI_MARE_PESCE"
  | "SALUTARE"
  | "FUSION"
  | "SORPRESA";

export type DishCategory =
  | "ANTIPASTO"
  | "PRIMO_PIATTO"
  | "PIATTO_PRINCIPALE"
  | "DESSERT"
  | "ALTRO";

export type Dish = {
  id: string;
  chefId: string;
  nomePiatto: string;
  categoria: DishCategory;
  descrizione: string | null;
  createdAt: string;
  updatedAt: string;
};

type Menu = {
  id: string;
  chefId: string;
  nome: string;
  descrizione?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  balance: MenuBalance;
  cuisineTypes: CuisineType[];
  createdAt: string;
  updatedAt: string;
};

type MenuDish = {
  id: string;
  chefId: string;
  menuId: string;
  dishId: string;
  categoria: DishCategory;
  nomePiatto: string;
  descrizione: string | null;
  ordine: number | null;
  createdAt: string;
  updatedAt: string;
};

type ApiListResponse<T> = { ok: true; data: T };
type ApiOneResponse<T> = { ok: true; data: T };

// ───────────────────── Props ─────────────────────
type MenuEditorModalProps = {
  open: boolean;
  mode: "create" | "edit";
  chefId: string;
  menu?: Menu;
  onClose: () => void;
  onSaved?: (menu: Menu) => void;
  onToast?: (kind: "success" | "error", message: string) => void;
};

// Icone lucide per ciascun tipo di cucina
const CUISINE_ICONS: Record<
  CuisineType,
  React.ComponentType<{ className?: string }>
> = {
  LOCALE: MapPin,
  GIAPPONESE: UtensilsCrossed,
  MEDITERRANEO: Sun,
  BBQ: Flame,
  FRUTTI_DI_MARE_PESCE: Fish,
  SALUTARE: Leaf,
  FUSION: Shuffle,
  SORPRESA: Gift,
};

// ───────────────────── Select Bilancio (custom, solo Tailwind) ─────────────────────
function BalanceSelect({
  value,
  onChange,
  label,
}: {
  value: MenuBalance;
  onChange: (v: MenuBalance) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const OPTIONS: MenuBalance[] = ["GUSTOSA", "EQUILIBRATO", "LEGGERA"];

  // chiusura al click fuori
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // chiusura con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="text-sm">
      {label ? <label className="block">{label}</label> : null}
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-2 flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 outline-none focus:border-[#C7AE6A66] focus:ring-1 focus:ring-[#C7AE6A33]"
        >
          <span>{readableBalance(value)}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-neutral-800 bg-black text-white shadow-lg"
          >
            {OPTIONS.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:text-[#C7AE6A] ${
                    opt === value ? "text-[#C7AE6A]" : ""
                  }`}
                >
                  {readableBalance(opt)}
                  {opt === value ? <Check className="h-4 w-4" /> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function MenuEditorModal({
  open,
  mode,
  chefId,
  menu,
  onClose,
  onSaved,
  onToast,
}: MenuEditorModalProps) {
  // campi base
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [balance, setBalance] = useState<MenuBalance>("GUSTOSA");
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [busy, setBusy] = useState(false);

  // piatti per categoria
  const [picked, setPicked] = useState<Record<DishCategory, Dish[]>>({
    ANTIPASTO: [],
    PRIMO_PIATTO: [],
    PIATTO_PRINCIPALE: [],
    DESSERT: [],
    ALTRO: [],
  });

  // modale selezione piatti
  type PickState = null | { open: true; cat: DishCategory };
  const [pickModal, setPickModal] = useState<PickState>(null);

  const [error, setError] = useState<string | null>(null);

  const CUISINES: CuisineType[] = [
    "LOCALE",
    "GIAPPONESE",
    "MEDITERRANEO",
    "BBQ",
    "FRUTTI_DI_MARE_PESCE",
    "SALUTARE",
    "FUSION",
    "SORPRESA",
  ];

  // ✅ AICI ADĂUGĂM ȘI ALTRO
  const CATEGORIES: DishCategory[] = [
    "ANTIPASTO",
    "PRIMO_PIATTO",
    "PIATTO_PRINCIPALE",
    "DESSERT",
    "ALTRO",
  ];

  // —— state pentru crop (exact ca la PhotoProfile) ——
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null); // sursa editor
  const [crop, setCrop] = useState<Crop>({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const onPickImage = () => fileInputRef.current?.click();

  const onImageBoxClick = () => {
    // dacă există deja imagine, click pe ea deschide file picker pentru a o înlocui & tăia
    onPickImage();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(f ? URL.createObjectURL(f) : null);
    setCrop({ unit: "px", x: 0, y: 0, width: 0, height: 0 });
  };

  function onCropImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    imgRef.current = img;
    const displayW = img.width;
    const displayH = img.height;
    const cw = Math.round(displayW * 0.8);
    const ch = Math.round(displayH * 0.8);
    const cx = Math.round((displayW - cw) / 2);
    const cy = Math.round((displayH - ch) / 2);
    setCrop({ unit: "px", x: cx, y: cy, width: cw, height: ch });
  }

  async function getCroppedBlob(image: HTMLImageElement, cropRect: Crop): Promise<Blob> {
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

  async function onApplyCrop() {
    if (!imgRef.current) return;
    const blob = await getCroppedBlob(imgRef.current, crop);
    // folosim un objectURL pentru preview și pentru a popula imageUrl (rămâne compatibil cu layout-ul și salvarea ta existentă)
    const objectUrl = URL.createObjectURL(blob);
    setImageUrl(objectUrl);
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview);
      setOriginalPreview(null);
    }
  }

  function onCancelCrop() {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(null);
  }

  // ───────────── Inizializzazione ─────────────
  useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      setNome("");
      setDescrizione("");
      setImageUrl("");
      setBalance("GUSTOSA");
      setCuisineTypes([]);
      setPicked({
        ANTIPASTO: [],
        PRIMO_PIATTO: [],
        PIATTO_PRINCIPALE: [],
        DESSERT: [],
        ALTRO: [],
      });
      setError(null);
      setBusy(false);
      return;
    }

    if (mode === "edit" && menu) {
      setNome(menu.nome);
      setDescrizione(menu.descrizione ?? "");
      setImageUrl(menu.imageUrl ?? "");
      setBalance(menu.balance);
      setCuisineTypes(menu.cuisineTypes ?? []);
      setPicked({
        ANTIPASTO: [],
        PRIMO_PIATTO: [],
        PIATTO_PRINCIPALE: [],
        DESSERT: [],
        ALTRO: [],
      });
      setError(null);
      setBusy(false);

      (async () => {
        try {
          const r = await api.get<ApiListResponse<MenuDish[]>>(
            `/api/chefs/${chefId}/menus/${menu.id}/dishes`,
            { validateStatus: () => true }
          );
          if (r.status === 200 && r.data?.data) {
            const bucket: Record<DishCategory, Dish[]> = {
              ANTIPASTO: [],
              PRIMO_PIATTO: [],
              PIATTO_PRINCIPALE: [],
              DESSERT: [],
              ALTRO: [],
            };
            for (const row of r.data.data) {
              bucket[row.categoria].push({
                id: row.dishId,
                chefId: row.chefId,
                nomePiatto: row.nomePiatto,
                categoria: row.categoria,
                descrizione: row.descrizione,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
              });
            }
            setPicked(bucket);
          }
        } catch {
          /* non bloccare l'apertura */
        }
      })().catch(() => {});
    }
  }, [open, mode, menu, chefId]);

  // ───────────── Azioni piatti ─────────────
  const addPicked = (d: Dish) =>
    setPicked((p) => ({ ...p, [d.categoria]: uniqById([...p[d.categoria], d]) }));

  // Stergere din DB + UI (optimistic) la click pe Trash
  const removeDish = async (cat: DishCategory, dish: Dish) => {
    const prev = picked[cat];
    // optimistic UI
    setPicked((p) => ({ ...p, [cat]: prev.filter((x) => x.id !== dish.id) }));

    // în create nu există legături în DB încă
    if (!(mode === "edit" && menu)) return;

    const ok = await safeDeleteMenuDish(chefId, menu.id, dish.id);
    if (!ok) {
      // rollback dacă API-ul nu a șters
      setPicked((p) => ({ ...p, [cat]: prev }));
      onToast?.("error", "Impossibile rimuovere il piatto");
    } else {
      onToast?.("success", "Piatto rimosso");
    }
  };

  // ───────────── Salvataggio ─────────────
  const save = useCallback(async () => {
    if (!chefId || busy) return;
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      setError("Il nome del menù è obbligatorio");
      return;
    }
    if (cuisineTypes.length > 3) {
      setError("Puoi scegliere al massimo 3 tipi di cucina");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      let savedMenu: Menu | null = null;

      if (mode === "create") {
        // crea menù
        const res = await api.post<ApiOneResponse<Menu>>(
          `/api/chefs/${chefId}/menus`,
          {
            nome: nomeTrim,
            descrizione: descrizione || undefined,
            imageUrl: imageUrl || undefined,
            balance,
            cuisineTypes,
          },
          { validateStatus: () => true }
        );
        if (res.status !== 201 || !res.data?.data)
          throw new Error("Creazione menù fallita");
        savedMenu = res.data.data;

        // aggiungi piatti selezionati
        const allPicked = [
          ...picked.ANTIPASTO,
          ...picked.PRIMO_PIATTO,
          ...picked.PIATTO_PRINCIPALE,
          ...picked.DESSERT,
          ...picked.ALTRO,
        ];
        let ordine = 1;
        for (const p of allPicked) {
          await api.post(
            `/api/chefs/${chefId}/menus/${savedMenu.id}/dishes`,
            { dishId: p.id, ordine },
            { validateStatus: () => true }
          );
          ordine += 1;
        }
      } else {
        if (!menu) throw new Error("Menù non trovato");

        // aggiorna menù
        const patch = await api.patch<ApiOneResponse<Menu>>(
          `/api/chefs/${chefId}/menus/${menu.id}`,
          {
            nome: nomeTrim,
            descrizione: descrizione || undefined,
            imageUrl: imageUrl || undefined,
            balance,
            cuisineTypes,
          },
          { validateStatus: () => true }
        );
        if (patch.status !== 200 || !patch.data?.data)
          throw new Error("Aggiornamento menù fallito");
        savedMenu = patch.data.data;

        // sincronizza piatti (ADD e DELETE)
        const currentRows = await api.get<ApiListResponse<MenuDish[]>>(
          `/api/chefs/${chefId}/menus/${menu.id}/dishes`,
          { validateStatus: () => true }
        );
        const currentList: MenuDish[] =
          currentRows.status === 200 && currentRows.data?.data
            ? currentRows.data.data
            : [];

        const already = new Set(currentList.map((r) => r.dishId));
        const pickedAll = [
          ...picked.ANTIPASTO,
          ...picked.PRIMO_PIATTO,
          ...picked.PIATTO_PRINCIPALE,
          ...picked.DESSERT,
          ...picked.ALTRO,
        ];
        const pickedSet = new Set(pickedAll.map((p) => p.id));

        // DELETE: presenti nel DB ma non più selezionati
        const toDelete = currentList.filter((r) => !pickedSet.has(r.dishId));
        for (const row of toDelete) {
          await api.delete(
            `/api/chefs/${chefId}/menus/${menu.id}/dishes/${row.dishId}`,
            { validateStatus: () => true }
          );
        }

        // ADD: selezionati ora ma non presenti già
        let ordine =
          currentList.length - toDelete.length + 1; // continua l'ordine după eventuale delete
        for (const p of pickedAll) {
          if (!already.has(p.id)) {
            await api.post(
              `/api/chefs/${chefId}/menus/${menu.id}/dishes`,
              { dishId: p.id, ordine },
              { validateStatus: () => true }
            );
            ordine += 1;
          }
        }
      }

      if (savedMenu) {
        onToast?.(
          "success",
          mode === "create" ? "Menù creato" : "Menù aggiornato"
        );
        onSaved?.(savedMenu);
      }
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Operazione fallita";
      setError(msg);
      onToast?.("error", msg);
      setBusy(false);
    }
  }, [
    chefId,
    busy,
    nome,
    descrizione,
    imageUrl,
    balance,
    cuisineTypes,
    picked,
    mode,
    menu,
    onClose,
    onSaved,
    onToast,
  ]);

  const showPicked = useMemo(
    () => CATEGORIES.map((cat) => ({ cat, items: picked[cat] })), 
    [picked]
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      ariaLabel={mode === "create" ? "Crea nuovo menù" : "Modifica menù"}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-xl font-semibold">
          {mode === "create" ? "Crea nuovo menù" : "Modifica menù"}
        </h2>
        <button
          className="rounded-lg p-1 hover:bg-neutral-800"
          onClick={onClose}
          aria-label="Chiudi"
          title="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Layout 2 colonne */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* SINISTRA */}
        <section className="rounded-2xl border border-[#C7AE6A33] bg-neutral-900/60 p-4 lg:p-5">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-neutral-400">
            DESCRIZIONE
          </h3>

          {/* Nome */}
          <label className="block text-sm">
            Nome del menù
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es. Menu Degustazione Mare"
              className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A66] focus:ring-1 focus:ring-[#C7AE6A33]"
            />
          </label>

          {/* Descrizione + counter */}
          <label className="mt-4 block text-sm">
            Descrizione del menù (opzionale)
            <div className="relative mt-2">
              <textarea
                rows={5}
                maxLength={200}
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                placeholder="Il gusto del mare al meglio..."
                className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 pr-14 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A66] focus:ring-1 focus:ring-[#C7AE6A33]"
              />
              <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-neutral-500">
                {descrizione.length} / 200
              </span>
            </div>
          </label>

          {/* Immagine menù (click pentru a alege și tăia) */}
          <div className="mt-4">
            <p className="text-sm">Immagine del menù (opzionale)</p>

            {imageUrl ? (
              <div
                className="relative mt-2 h-40 w-full overflow-hidden rounded-xl border border-dashed border-[#C7AE6A55] bg-neutral-900 cursor-pointer"
                onClick={onImageBoxClick}
                title="Clicca per modificare"
              >
                <img
                  src={imageUrl}
                  alt="Anteprima immagine menù"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUrl("");
                  }}
                  title="Rimuovi immagine"
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-neutral-200 hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="menu-image"
                className="mt-2 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#C7AE6A55] bg-[#C7AE6A14]/20 text-neutral-200 transition hover:bg-[#C7AE6A14]/40"
                title="Aggiungi immagine"
              >
                <div className="flex items-center gap-2 rounded-full bg-[#C7AE6A22] px-3 py-1">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm">Aggiungi immagine</span>
                </div>
                <input
                  ref={fileInputRef}
                  id="menu-image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
            )}

            {/* editor crop (apare doar după selectarea unei imagini noi) */}
            {originalPreview && (
              <div className="mt-3">
                <div className="rounded-xl overflow-hidden border border-neutral-800 inline-block w-full">
                  <ReactCrop crop={crop} onChange={(c) => setCrop(c)} keepSelection className="block w-full">
                    <img
                      src={originalPreview}
                      alt="Anteprima crop"
                      onLoad={onCropImageLoad}
                      className="block w-full h-auto max-h-[70vh]"
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                </div>

                <div className="mt-3 flex items-center justify-center gap-3">
                  <Button variant="secondary" onClick={onCancelCrop} className="h-10 px-4">
                    Annulla
                  </Button>
                  <Button onClick={onApplyCrop} className="h-10 px-4">
                    Applica ritaglio
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bilancio + Tipi di cucina (icone) */}
          <div className="mt-4 grid gap-4">
            <BalanceSelect
              value={balance}
              onChange={(v) => setBalance(v)}
              label="Bilancio"
            />

            <div className="text-sm">
              <Paragraph size="sm">Tipo di cibo (Puoi selezionare fino a 3)</Paragraph>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CUISINES.map((c) => {
                  const active = cuisineTypes.includes(c);
                  const Icon = CUISINE_ICONS[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setCuisineTypes((prev) => {
                          const on = prev.includes(c);
                          if (on) return prev.filter((x) => x !== c);
                          if (prev.length >= 3) return prev;
                          return [...prev, c];
                        })
                      }
                      className={[
                        "flex items-center justify-between rounded-lg border px-3 py-4 text-left text-md font-semibold transition",
                        active
                          ? "border-[#C7AE6A] text-[#C7AE6A] bg-[#C7AE6A1A]"
                          : "border-[#C7AE6A33] text-neutral-300 hover:bg-[#C7AE6A14]",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={[
                            "grid h-4 w-4 place-items-center rounded-sm border",
                            active
                              ? "border-[#C7AE6A] bg-[#C7AE6A]"
                              : "border-[#C7AE6A55]",
                          ].join(" ")}
                        >
                          {active ? <span className="h-2 w-2 bg-[#C7AE6A]" /> : null}
                        </span>
                        <Icon className="h-6 w-6" />
                        {readableCuisine(c)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* input file ascuns pentru cazul când există deja imagine și dai click pe ea */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </section>

        {/* DESTRA */}
        <aside className="space-y-4">
          {showPicked.map(({ cat, items }) => (
            <div
              key={cat}
              className="rounded-2xl border border-[#C7AE6A33] bg-neutral-900/60 p-4 lg:p-5"
            >
              <div className="flex items-center justify-between">
                <h5 className="font-semibold">{readableCat(cat)}</h5>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setPickModal({ open: true, cat })}
                >
                  <span className="flex items-center">
                    <Plus className="h-4 w-4" />
                    Aggiungi
                  </span>
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-400">
                  Nessun {readableCat(cat)} aggiunto
                </p>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {items.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border border-[#C7AE6A33] bg-neutral-900/70 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {d.nomePiatto}
                        </div>
                        {d.descrizione && (
                          <div className="truncate text-xs text-neutral-400">
                            {d.descrizione}
                          </div>
                        )}
                      </div>
                      <button
                        className="text-neutral-300 transition hover:text-red-400"
                        title="Rimuovi"
                        onClick={() => removeDish(cat, d)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </aside>
      </div>

      {/* Error inline */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Footer — butoane egale 50/50 */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          className="h-10 w-full"
          disabled={busy}
        >
          Annulla
        </Button>
        <Button
          onClick={save}
          className="h-10 w-full"
          disabled={busy || !chefId}
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Salvataggio…" : "Salvataggio modifiche…"}
            </span>
          ) : mode === "create" ? (
            "Salva menù"
          ) : (
            "Salva modifiche"
          )}
        </Button>
      </div>

      {/* Modale selezione piatti */}
      {pickModal?.open && (
        <SelectDishModal
          open={pickModal.open}
          onClose={() => setPickModal(null)}
          chefId={chefId}
          category={pickModal.cat}
          onSelect={(dish) => addPicked(dish)}
        />
      )}
    </ModalShell>
  );
}

// ───────────────────── Helpers ─────────────────────
function uniqById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const a of arr) {
    if (!seen.has(a.id)) {
      out.push(a);
      seen.add(a.id);
    }
  }
  return out;
}

function readableBalance(b: MenuBalance): string {
  if (b === "GUSTOSA") return "Gustosa";
  if (b === "EQUILIBRATO") return "Equilibrato";
  return "Leggera";
}

function readableCuisine(c: CuisineType): string {
  switch (c) {
    case "LOCALE":
      return "Locale";
    case "GIAPPONESE":
      return "Giapponese";
    case "MEDITERRANEO":
      return "Mediterraneo";
    case "BBQ":
      return "BBQ";
    case "FRUTTI_DI_MARE_PESCE":
      return "Frutti di mare/Pesce";
    case "SALUTARE":
      return "Salutare";
    case "FUSION":
      return "Fusion";
    case "SORPRESA":
      return "Sorpresa";
    default:
      return c;
  }
}

function readableCat(c: DishCategory): string {
  switch (c) {
    case "ANTIPASTO":
      return "Antipasto";
    case "PRIMO_PIATTO":
      return "Primo piatto";
    case "PIATTO_PRINCIPALE":
      return "Piatto principale";
    case "DESSERT":
      return "Dessert";
    case "ALTRO":
      return "Altro";
    default:
      return c;
  }
}

/**
 * Ștergere sigură din MenuDish:
 *  - încearcă DELETE cu dishId
 *  - dacă API-ul cere row.id, găsește rândul și șterge cu row.id
 *  - fallback pentru endpoint alternativ /api/menu-dishes/:id
 */
async function safeDeleteMenuDish(
  chefId: string,
  menuId: string,
  dishId: string
): Promise<boolean> {
  // 1) Încercare directă: endpoint care primește dishId
  let res = await api.delete(
    `/api/chefs/${chefId}/menus/${menuId}/dishes/${dishId}`,
    { validateStatus: () => true }
  );
  if (res.status >= 200 && res.status < 300) return true;

  // 2) Fallback: unele API-uri cer row.id din tabela pivot
  const rows = await api.get<ApiListResponse<MenuDish[]>>(
    `/api/chefs/${chefId}/menus/${menuId}/dishes`,
    { validateStatus: () => true }
  );

  if (rows.status === 200 && rows.data?.data) {
    const row = rows.data.data.find((r) => r.dishId === dishId);
    if (row) {
      // 2a) Încearcă aceeași rută dar cu row.id
      res = await api.delete(
        `/api/chefs/${chefId}/menus/${menuId}/dishes/${row.id}`,
        { validateStatus: () => true }
      );
      if (res.status >= 200 && res.status < 300) return true;

      // 2b) Endpoint alternativ uzual
      res = await api.delete(`/api/menu-dishes/${row.id}`, {
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) return true;
    }
  }

  return false;
}
