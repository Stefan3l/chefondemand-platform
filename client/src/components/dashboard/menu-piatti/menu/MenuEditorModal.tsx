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
  Pencil,
} from "lucide-react";
import ModalShell from "@/components/dashboard/menu-piatti/menu/ModalShell";
import SelectDishModal from "@/components/dashboard/menu-piatti/menu/SelectDishModal";

import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

/* ───────────────────── Tipi dominio (coerenti con backend) ───────────────────── */
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

/* ───────────────────── Props ───────────────────── */
type MenuEditorModalProps = {
  open: boolean;
  mode: "create" | "edit";
  chefId: string;
  menu?: Menu;
  onClose: () => void;
  onSaved?: (menu: Menu) => void;
  onToast?: (kind: "success" | "error", message: string) => void;
};

/* Icone lucide per ciascun tipo di cucina */
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

/* ───────────────────── Select Bilancio ───────────────────── */
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

/* ───────────────────── CropImageModal ─────────────────────
   Nota: `aspect` è prop del componente ReactCrop, NON nel tipo `Crop`.
*/
function CropImageModal({
  open,
  src,
  onClose,
  onCropped,
  aspect = 16 / 9,
}: {
  open: boolean;
  src: string;
  aspect?: number;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  useEffect(() => {
    if (!open) {
      setCrop(undefined);
      setCompletedCrop(null);
    }
  }, [open]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const image = e.currentTarget;
    const w = image.naturalWidth;
    theHeight: {
      /* solo per chiarezza, nessun uso separato */
    }
    const h = image.naturalHeight;

    const widthPct = 90;
    const heightPx = (w * (widthPct / 100)) / aspect;
    const heightPct = Math.min(100, (heightPx / h) * 100);

    const initial: Crop = {
      unit: "%",
      width: widthPct,
      x: (100 - widthPct) / 2,
      y: Math.max(0, (100 - heightPct) / 2),
      height: heightPct,
    };
    setCrop(initial);
  };

  async function getCroppedBlob(): Promise<Blob | null> {
    if (!imgRef.current || !completedCrop) return null;
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const px = Math.round(completedCrop.width);
    const py = Math.round(completedCrop.height);

    canvas.width = px;
    canvas.height = py;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      Math.round(completedCrop.x),
      Math.round(completedCrop.y),
      px,
      py,
      0,
      0,
      px,
      py
    );

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
    );
  }

  const handleConfirm = async () => {
    const blob = await getCroppedBlob();
    if (!blob) return;
    onCropped(blob);
    onClose();
  };

  if (!open) return null;

  return (
    <ModalShell open={open} onClose={onClose} ariaLabel="Taglia immagine menù">
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-xl font-semibold">Ritaglia immagine menù</h2>
        <button
          className="rounded-lg p-1 hover:bg-neutral-800"
          onClick={onClose}
          aria-label="Chiudi"
          title="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-xl border border-[#C7AE6A33] bg-neutral-900/60 p-4">
        <ReactCrop
          crop={crop}
          aspect={aspect}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          keepSelection
          className="max-h-[60vh]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Per il ritaglio"
            onLoad={onImageLoad}
            className="max-h-[60vh] w-auto"
          />
        </ReactCrop>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onClose} className="h-10 w-full">
          Annulla
        </Button>
        <Button onClick={handleConfirm} className="h-10 w-full">
          Conferma ritaglio
        </Button>
      </div>
    </ModalShell>
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
  /* campi base */
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");

  /* imagine (DB + preview local) */
  const [imageUrl, setImageUrl] = useState("");
  const [serverImagePath, setServerImagePath] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  type ImageAction = "none" | "add" | "replace" | "remove";
  const [imageAction, setImageAction] = useState<ImageAction>("none");

  const [balance, setBalance] = useState<MenuBalance>("GUSTOSA");
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [busy, setBusy] = useState(false);

  /* piatti per categoria (include ALTRO) */
  const [picked, setPicked] = useState<Record<DishCategory, Dish[]>>({
    ANTIPASTO: [],
    PRIMO_PIATTO: [],
    PIATTO_PRINCIPALE: [],
    DESSERT: [],
    ALTRO: [],
  });

  /* modale selezione piatti */
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

  const CATEGORIES: DishCategory[] = [
    "ANTIPASTO",
    "PRIMO_PIATTO",
    "PIATTO_PRINCIPALE",
    "DESSERT",
    "ALTRO",
  ];

  /* crop file source */
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  /* cleanup cropSrc */
  useEffect(() => {
    if (!open) return;
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [open, cropSrc]);

  /* inițializare din props / DB */
  useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      setNome("");
      setDescrizione("");
      setImageUrl("");
      setServerImagePath(null);
      setImageBlob(null);
      setImageAction("none");
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
      setImageUrl(menu.imageUrl ?? ""); // vizibil imediat dacă e în DB
      setServerImagePath(menu.imagePath ?? null);
      setImageBlob(null);
      setImageAction("none");
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

  /* piatti helpers */
  const addPicked = (d: Dish) =>
    setPicked((p) => ({ ...p, [d.categoria]: uniqById([...p[d.categoria], d]) }));

  const removeDish = async (cat: DishCategory, dish: Dish) => {
    const prev = picked[cat];
    setPicked((p) => ({ ...p, [cat]: prev.filter((x) => x.id !== dish.id) }));
    if (!(mode === "edit" && menu)) return;

    const ok = await safeDeleteMenuDish(chefId, menu.id, dish.id);
    if (!ok) {
      setPicked((p) => ({ ...p, [cat]: prev }));
      onToast?.("error", "Impossibile rimuovere il piatto");
    } else {
      onToast?.("success", "Piatto rimosso");
    }
  };

  /* select + crop imagine */
  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const f = target.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      setCropSrc(url);
    };
    input.click();
  };

  const handleCropped = (blob: Blob) => {
    const preview = URL.createObjectURL(blob);
    if (imageUrl && imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageUrl(preview); // preview local
    setImageBlob(blob); // blob de urcat
    setImageAction(imageUrl ? "replace" : "add");
  };

  const handleRemoveImage = () => {
    if (imageUrl && imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    setImageBlob(null);
    setImageAction(menu?.imageUrl ? "remove" : "none");
  };

  /* ───────────────── Upload generic + PATCH pe meniu ───────────────── */
  async function uploadBlobToServer(
    file: Blob
  ): Promise<{ imageUrl: string; imagePath?: string } | null> {
    const fd = new FormData();
    fd.append("file", file, "menu.jpg");

    const CANDIDATES = ["/api/uploads?folder=menus", "/api/uploads", "/api/upload"];

    for (const url of CANDIDATES) {
      try {
        const res = await api.post(url, fd, {
          headers: { "Content-Type": "multipart/form-data" },
          validateStatus: () => true,
        });
        if (res.status >= 200 && res.status < 300 && res.data?.data?.imageUrl) {
          return res.data.data as { imageUrl: string; imagePath?: string };
        }
      } catch {
        /* try next */
      }
    }
    return null;
  }

  /* ───────────────── Drag & Drop: doar reordonare în aceeași categorie ───────────────── */
  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;

    const sourceCat = source.droppableId as DishCategory;
    const destCat = destination.droppableId as DishCategory;

    // reordonăm numai în cadrul aceleiași categorii
    if (sourceCat !== destCat) return;

    setPicked((prev) => {
      const newList = Array.from(prev[sourceCat]);
      const [moved] = newList.splice(source.index, 1);
      newList.splice(destination.index, 0, moved);
      return { ...prev, [sourceCat]: newList };
    });
  };

  /* ───────────────── Salvataggio ───────────────── */
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
        /* 1) creează meniu fără imagine */
        const res = await api.post<ApiOneResponse<Menu>>(
          `/api/chefs/${chefId}/menus`,
          {
            nome: nomeTrim,
            descrizione: descrizione || undefined,
            balance,
            cuisineTypes,
          },
          { validateStatus: () => true }
        );
        if (res.status !== 201 || !res.data?.data)
          throw new Error("Creazione menù fallita");
        savedMenu = res.data.data;

        /* 2) încarcă imagine dacă e nouă, apoi PATCH pe meniu */
        if (imageAction === "add" && imageBlob) {
          const up = await uploadBlobToServer(imageBlob);
          if (up?.imageUrl) {
            const p = await api.patch<ApiOneResponse<Menu>>(
              `/api/chefs/${chefId}/menus/${savedMenu.id}`,
              { imageUrl: up.imageUrl, imagePath: up.imagePath },
              { validateStatus: () => true }
            );
            if (p.status >= 200 && p.status < 300 && p.data?.data) {
              setImageUrl(p.data.data.imageUrl ?? "");
              setServerImagePath(p.data.data.imagePath ?? null);
              setImageAction("none");
              setImageBlob(null);
            }
          }
        }

        /* 3) adaugă piatti selectați în ordinea curentă (după drag&drop) */
        const allPicked = [
          ...picked.ANTIPASTO,
          ...picked.PRIMO_PIATTO,
          ...picked.PIATTO_PRINCIPALE,
          ...picked.DESSERT,
          ...picked.ALTRO,
        ];
        let ordine = 1;
        for (const pz of allPicked) {
          await api.post(
            `/api/chefs/${chefId}/menus/${savedMenu.id}/dishes`,
            { dishId: pz.id, ordine },
            { validateStatus: () => true }
          );
          ordine += 1;
        }
      } else {
        if (!menu) throw new Error("Menù non trovato");

        /* 1) patch câmpuri non-imagine */
        const patch = await api.patch<ApiOneResponse<Menu>>(
          `/api/chefs/${chefId}/menus/${menu.id}`,
          {
            nome: nomeTrim,
            descrizione: descrizione || undefined,
            balance,
            cuisineTypes,
          },
          { validateStatus: () => true }
        );
        if (patch.status !== 200 || !patch.data?.data)
          throw new Error("Aggiornamento menù fallito");
        savedMenu = patch.data.data;

        /* 2) sincronizează piatti (delete / add) în funcție de lista actuală */
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

        const toDelete = currentList.filter((r) => !pickedSet.has(r.dishId));
        for (const row of toDelete) {
          await api.delete(
            `/api/chefs/${chefId}/menus/${menu.id}/dishes/${row.dishId}`,
            { validateStatus: () => true }
          );
        }

        // adăugăm ce e nou în ordinea curentă (post-drag&drop)
        let ordine = 1;
        for (const pz of pickedAll) {
          if (!already.has(pz.id)) {
            await api.post(
              `/api/chefs/${chefId}/menus/${menu.id}/dishes`,
              { dishId: pz.id, ordine },
              { validateStatus: () => true }
            );
          } else {
            // dacă există deja, îi putem face un PATCH de ordine dacă API-ul îl expune (opzionale)
            // aici presupunem că ordinea va fi recalculată când refacem lista; dacă ai endpoint dedicat, îl poți folosi.
          }
          ordine += 1;
        }

        /* 3) imagine */
        if ((imageAction === "add" || imageAction === "replace") && imageBlob) {
          const up = await uploadBlobToServer(imageBlob);
          if (up?.imageUrl) {
            const p = await api.patch<ApiOneResponse<Menu>>(
              `/api/chefs/${chefId}/menus/${menu.id}`,
              { imageUrl: up.imageUrl, imagePath: up.imagePath },
              { validateStatus: () => true }
            );
            if (p.status >= 200 && p.status < 300 && p.data?.data) {
              setImageUrl(p.data.data.imageUrl ?? "");
              setServerImagePath(p.data.data.imagePath ?? null);
              setImageAction("none");
              setImageBlob(null);
            }
          }
        } else if (imageAction === "remove") {
          const r = await api.patch<ApiOneResponse<Menu>>(
            `/api/chefs/${chefId}/menus/${menu.id}`,
            { imageUrl: null, imagePath: null },
            { validateStatus: () => true }
          );
          if (r.status >= 200 && r.status < 300 && r.data?.data) {
            setImageUrl("");
            setServerImagePath(null);
            setImageAction("none");
            setImageBlob(null);
          }
        }
      }

      // fetch final menù din DB pentru onSaved
      if (savedMenu) {
        try {
          const fresh = await api.get<ApiOneResponse<Menu>>(
            `/api/chefs/${chefId}/menus/${savedMenu.id}`,
            { validateStatus: () => true }
          );
          const finalMenu =
            fresh.status === 200 && fresh.data?.data ? fresh.data.data : savedMenu;
          onToast?.("success", mode === "create" ? "Menù creato" : "Menù aggiornato");
          onSaved?.(finalMenu);
        } catch {
          onToast?.("success", mode === "create" ? "Menù creato" : "Menù aggiornato");
          onSaved?.(savedMenu);
        }
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
    balance,
    cuisineTypes,
    picked,
    mode,
    menu,
    onClose,
    onSaved,
    onToast,
    imageAction,
    imageBlob,
  ]);

  const showPicked = useMemo(
    () => CATEGORIES.map((cat) => ({ cat, items: picked[cat] })),
    [
      picked.ANTIPASTO,
      picked.PRIMO_PIATTO,
      picked.PIATTO_PRINCIPALE,
      picked.DESSERT,
      picked.ALTRO,
    ]
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

          {/* Immagine menù */}
          <div className="mt-4">
            <p className="text-sm">Immagine del menù (opzionale)</p>

            {imageUrl ? (
              <div className="relative mt-2 h-40 w-full overflow-hidden rounded-xl border border-dashed border-[#C7AE6A55] bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Anteprima immagine menù"
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-2 top-2 flex gap-2">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    title="Cambia immagine"
                    className="rounded-full bg-black/70 p-1 text-neutral-200 hover:bg-black"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Rimuovi immagine"
                    className="rounded-full bg-black/70 p-1 text-neutral-200 hover:bg-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openFilePicker}
                className="mt-2 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#C7AE6A55] bg-[#C7AE6A14]/20 text-neutral-200 transition hover:bg-[#C7AE6A14]/40"
                title="Aggiungi immagine"
              >
                <div className="flex items-center gap-2 rounded-full bg-[#C7AE6A22] px-3 py-1">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm">Aggiungi immagine</span>
                </div>
              </button>
            )}
          </div>

          {/* Bilancio + Tipi di cucina */}
          <div className="mt-4 grid gap-4">
            <BalanceSelect
              value={balance}
              onChange={(v) => setBalance(v)}
              label="Bilancio"
            />

            <div className="text-sm">
              <Paragraph size="sm">
                Tipo di cibo (Puoi selezionare fino a 3)
              </Paragraph>

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
                          {active ? (
                            <span className="h-2 w-2 bg-[#C7AE6A]" />
                          ) : null}
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
        </section>

        {/* DESTRA: include și ALTRO — Drag & Drop per categoria */}
        <aside className="space-y-4">
          <DragDropContext onDragEnd={onDragEnd}>
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
                  <Droppable droppableId={cat}>
                    {(provided) => (
                      <ul
                        className="mt-3 grid gap-2"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {items.map((d, index) => (
                          <Draggable key={d.id} draggableId={d.id} index={index}>
                            {(prov) => (
                              <li
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                )}
              </div>
            ))}
          </DragDropContext>
        </aside>
      </div>

      {/* Error inline */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          className="h-10 w-full"
          disabled={busy}
        >
          Annulla
        </Button>
        <Button onClick={save} className="h-10 w-full" disabled={busy || !chefId}>
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

      {/* Modale crop imagine */}
      {cropSrc && (
        <CropImageModal
          open={!!cropSrc}
          src={cropSrc}
          onClose={() => {
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
          onCropped={handleCropped}
          aspect={16 / 9}
        />
      )}
    </ModalShell>
  );
}

/* ───────────────────── Helpers ───────────────────── */
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

/* Ștergere sigură din MenuDish (fallback pe mai multe endpoint-uri) */
async function safeDeleteMenuDish(
  chefId: string,
  menuId: string,
  dishId: string
): Promise<boolean> {
  let res = await api.delete(
    `/api/chefs/${chefId}/menus/${menuId}/dishes/${dishId}`,
    { validateStatus: () => true }
  );
  if (res.status >= 200 && res.status < 300) return true;

  const rows = await api.get<ApiListResponse<MenuDish[]>>(
    `/api/chefs/${chefId}/menus/${menuId}/dishes`,
    { validateStatus: () => true }
  );

  if (rows.status === 200 && rows.data?.data) {
    const row = rows.data.data.find((r) => r.dishId === dishId);
    if (row) {
      res = await api.delete(
        `/api/chefs/${chefId}/menus/${menuId}/dishes/${row.id}`,
        { validateStatus: () => true }
      );
      if (res.status >= 200 && res.status < 300) return true;

      res = await api.delete(`/api/menu-dishes/${row.id}`, {
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) return true;
    }
  }

  return false;
}
