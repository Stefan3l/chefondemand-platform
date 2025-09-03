"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/axios";
import { Button, Heading, Paragraph } from "@/components/ui";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
import ModalShell from "@/components/dashboard/menu-piatti/menu/ModalShell";
import SelectDishModal from "@/components/dashboard/menu-piatti/menu/SelectDishModal";

// ───────────────────── Tipi dominio (coerenti col backend) ─────────────────────
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
  menu?: Menu; // richiesto in modalità edit
  onClose: () => void;
  /** facoltativo: avvisa il genitore per ricaricare lista o mostrare toast */
  onSaved?: (menu: Menu) => void;
  /** facoltativo: toast esterno */
  onToast?: (kind: "success" | "error", message: string) => void;
};

/**
 * Modale editor per Menù (create/edit)
 * - Responsivo: centrato su desktop, scroll-y su mobile (scrollbar nascosta via .scrollbar-none)
 * - Campi base: nome, descrizione, immagine, bilancio, tipo di cibo (max 3)
 * - Sezioni piatti per categoria con "Aggiungi" (riusa SelectDishModal)
 */
export default function MenuEditorModal({
  open,
  mode,
  chefId,
  menu,
  onClose,
  onSaved,
  onToast,
}: MenuEditorModalProps) {
  // stato campi base
  const [nome, setNome] = useState<string>("");
  const [descrizione, setDescrizione] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [balance, setBalance] = useState<MenuBalance>("GUSTOSA");
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [busy, setBusy] = useState(false);

  // stato piatti selezionati per categoria (incluso ALTRO per coerenza)
  const [picked, setPicked] = useState<Record<DishCategory, Dish[]>>({
    ANTIPASTO: [],
    PRIMO_PIATTO: [],
    PIATTO_PRINCIPALE: [],
    DESSERT: [],
    ALTRO: [],
  });

  // selezione piatti tramite modale secondaria
  type PickState =
    | null
    | {
        open: true;
        cat: DishCategory;
      };
  const [pickModal, setPickModal] = useState<PickState>(null);

  // errori locali (minimi)
  const [error, setError] = useState<string | null>(null);

  // costanti UI
  const BALANCES: MenuBalance[] = ["GUSTOSA", "EQUILIBRATO", "LEGGERA"];
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
  ];

  // ───────────── Inizializzazione in base alla modalità ─────────────
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

    // edit: precompila con i dati esistenti
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

      // carica piatti attuali del menù
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
          // non bloccare l’apertura del modale
        }
      })().catch(() => {});
    }
  }, [open, mode, menu, chefId]);

  // ───────────── Azioni su piatti selezionati ─────────────
  const addPicked = (d: Dish) =>
    setPicked((p) => ({
      ...p,
      [d.categoria]: uniqById([...p[d.categoria], d]),
    }));

  const removePicked = (cat: DishCategory, id: string) =>
    setPicked((p) => ({
      ...p,
      [cat]: p[cat].filter((x) => x.id !== id),
    }));

  // ───────────── Salvataggio (create/edit) ─────────────
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
        if (res.status !== 201 || !res.data?.data) throw new Error("Creazione menù fallita");
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

        // aggiungi solo nuovi piatti (no rimozione in questo step)
        const currentRows = await api.get<ApiListResponse<MenuDish[]>>(
          `/api/chefs/${chefId}/menus/${menu.id}/dishes`,
          { validateStatus: () => true }
        );
        const already: Set<string> =
          currentRows.status === 200 && currentRows.data?.data
            ? new Set(currentRows.data.data.map((r) => r.dishId))
            : new Set();

        const allPicked = [
          ...picked.ANTIPASTO,
          ...picked.PRIMO_PIATTO,
          ...picked.PIATTO_PRINCIPALE,
          ...picked.DESSERT,
          ...picked.ALTRO,
        ];
        let ordine =
          (currentRows.status === 200 && currentRows.data?.data ? currentRows.data.data.length : 0) +
          1;
        for (const p of allPicked) {
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
        onToast?.("success", mode === "create" ? "Menù creato" : "Menù aggiornato");
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

  // ───────────── UI ─────────────
  const showPicked = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        cat,
        items: picked[cat],
      })),
    [picked]
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      ariaLabel={mode === "create" ? "Crea nuovo menù" : "Modifica menù"}
      maxWidth="6xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h4 className="text-lg font-semibold">
          {mode === "create" ? "Crea nuovo menù" : "Modifica menù"}
        </h4>
        <button
          className="rounded-lg p-1 hover:bg-neutral-800"
          onClick={onClose}
          aria-label="Chiudi"
          title="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Layout 2 colonne: sinistra info menù, destra piatti per categoria */}
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* SINISTRA: descrizione + meta */}
        <div className="rounded-2xl border border-[#C7AE6A33] bg-neutral-900/50 p-4">
          <h5 className="mb-3 text-sm tracking-wide text-neutral-400">DESCRIZIONE</h5>

          <label className="block text-sm">
            Nome del menù
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es. Menu Degustazione Mare"
              className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
            />
          </label>

          <label className="mt-4 block text-sm">
            Descrizione del menù (opzionale)
            <textarea
              rows={5}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Il gusto del mare al meglio..."
              className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
            />
          </label>

          <label className="mt-4 block text-sm">
            Immagine del menù (opzionale)
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL immagine"
              className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Bilancio
              <select
                value={balance}
                onChange={(e) => setBalance(e.target.value as MenuBalance)}
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
              >
                {BALANCES.map((b) => (
                  <option key={b} value={b}>
                    {readableBalance(b)}
                  </option>
                ))}
              </select>
            </label>

            <div className="text-sm">
              Tipo di cibo (max 3)
              <div className="mt-2 flex flex-wrap gap-2">
                {CUISINES.map((c) => {
                  const active = cuisineTypes.includes(c);
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
                        "rounded-lg border px-3 py-1 text-sm transition",
                        active
                          ? "border-[#C7AE6A] text-[#C7AE6A] bg-[#C7AE6A22]"
                          : "border-[#C7AE6A33] text-neutral-300 hover:bg-[#C7AE6A11]",
                      ].join(" ")}
                    >
                      {readableCuisine(c)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* DESTRA: piatti per categoria (UI mostra 4 sezioni; ALTRO gestito nei dati) */}
        <div className="space-y-4">
          {showPicked.map(({ cat, items }) => (
            <div
              key={cat}
              className="rounded-2xl border border-[#C7AE6A33] bg-neutral-900/50 p-4"
            >
              <div className="flex items-center justify-between">
                <h5 className="font-semibold">{readableCat(cat)}</h5>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setPickModal({ open: true, cat })}
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi
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
                      className="flex items-center justify-between rounded-lg border border-[#C7AE6A33] bg-neutral-900/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{d.nomePiatto}</div>
                        {d.descrizione && (
                          <div className="truncate text-xs text-neutral-400">
                            {d.descrizione}
                          </div>
                        )}
                      </div>
                      <button
                        className="text-neutral-300 hover:text-red-400"
                        title="Rimuovi"
                        onClick={() => removePicked(cat, d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error inline */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Footer azioni */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" onClick={onClose} className="h-10 px-4" disabled={busy}>
          Annulla
        </Button>
        <Button onClick={save} className="h-10 px-5" disabled={busy || !chefId}>
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

      {/* Modale secondaria: selezione piatti per categoria */}
      {pickModal?.open && (
        <SelectDishModal
          open={pickModal.open}
          onClose={() => setPickModal(null)}
          chefId={chefId}
          category={pickModal.cat}
          onSelect={(dish) => {
            addPicked(dish);
          }}
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
