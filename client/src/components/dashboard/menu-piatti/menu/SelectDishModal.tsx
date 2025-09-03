// src/components/menu/SelectDishModal.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Search, Loader2, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/axios";
import { Button, Heading, Paragraph } from "@/components/ui";
import ModalShell from "@/components/dashboard/menu-piatti/menu/ModalShell";

// ───────────── Tipi dominio (coerenti col backend) ─────────────
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

type ApiListResponse<T> = { ok: true; data: T };
type ApiOneResponse<T> = { ok: true; data: T };

// ───────────── Props componente ─────────────
type SelectDishModalProps = {
  open: boolean;
  onClose: () => void;
  chefId: string;
  category: DishCategory;
  onSelect: (dish: Dish) => void;
};

// ─────────────────────────────────────────────────────────────
// Modale con:
// - overlay scroll-y su mobile
// - container principale my-10 (solo mobile)
// - pannello responsive con max-height + overflow-y-auto
// ─────────────────────────────────────────────────────────────
export default function SelectDishModal({
  open,
  onClose,
  chefId,
  category,
  onSelect,
}: SelectDishModalProps) {
  const [items, setItems] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // riferimento (non indispensabile ma utile per future estensioni)
  const rootRef = useRef<HTMLDivElement>(null);

  // carica piatti per categoria
  const load = useCallback(async () => {
    if (!open || !chefId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiListResponse<Dish[]>>(
        `/api/chefs/${chefId}/dishes?category=${encodeURIComponent(category)}`,
        { validateStatus: () => true }
      );
      if (res.status === 200 && res.data?.data) {
        setItems(res.data.data);
      } else {
        setError("Impossibile caricare i piatti");
      }
      setLoadedOnce(true);
    } catch {
      setError("Impossibile caricare i piatti");
      setLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [open, chefId, category]);

  useEffect(() => {
    if (open) {
      void load();
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setQuery("");
    }
  }, [open, load]);

  // filtro client-side
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.nomePiatto.toLowerCase().includes(q));
  }, [items, query]);

  // crea piatto veloce
  const onCreateDish = async () => {
    const nome = newName.trim();
    const descrizione = newDesc.trim();
    if (!nome) {
      setError("Il nome del piatto è obbligatorio");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await api.post<ApiOneResponse<Dish>>(
        `/api/chefs/${chefId}/dishes`,
        {
          nomePiatto: nome,
          categoria: category,
          descrizione: descrizione || null,
        },
        { validateStatus: () => true }
      );
      if (res.status !== 201 || !res.data?.data) {
        setError("Creazione piatto fallita");
      } else {
        await load();
        setShowCreate(false);
        setNewName("");
        setNewDesc("");
      }
    } catch {
      setError("Creazione piatto fallita");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      ariaLabel="Seleziona un piatto"
      maxWidth="3xl"
      className=""
    >
      <div ref={rootRef}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-wide">
            Seleziona un piatto — {readableCat(category)}
          </h3>
          <button
            className="rounded-lg p-1 hover:bg-neutral-800"
            aria-label="Chiudi"
            onClick={onClose}
            title="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra azioni: cerca + crea */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per nome…"
              className="w-full rounded-full border border-[#C7AE6A33] bg-neutral-900/80 px-10 py-2 text-sm placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          </div>

          <Button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4"
            onClick={() => setShowCreate((v) => !v)}
            title={showCreate ? "Chiudi creazione" : "Crea nuovo piatto"}
          >
            <span className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              {showCreate ? "Chiudi" : "Crea nuovo piatto"}
            </span>
          </Button>
        </div>

        {/* Quick create */}
        {showCreate && (
          <div className="mt-4 rounded-2xl border border-[#C7AE6A33] bg-neutral-900/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Nome del piatto
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Es. Spaghetti alle vongole"
                  className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
                />
              </label>
              <label className="text-sm">
                Categoria
                <input
                  value={readableCat(category)}
                  disabled
                  className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-400 outline-none"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm">
              Descrizione (opzionale)
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Breve descrizione…"
                className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
              />
            </label>
            <div className="mt-4 flex justify-end">
              <Button className="h-10 px-5" onClick={onCreateDish} disabled={creating}>
                {creating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvataggio…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Salva piatto
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Stato/errori */}
        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Lista piatti */}
        <div className="mt-4 max-h-[50vh] overflow-auto pr-1">
          {loading && !loadedOnce ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <UtensilsCrossed className="h-4 w-4" />
              Nessun piatto trovato
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {filtered.map((d) => (
                <li
                  key={d.id}
                  className="rounded-2xl border border-[#C7AE6A33] bg-neutral-900/50 p-4 hover:border-[#C7AE6A] transition"
                >
                  <div className="flex flex-col gap-1">
                    <Heading level="h4" className="font-semibold line-clamp-2">
                      {d.nomePiatto}
                    </Heading>
                    <div>
                      <span className="inline-block rounded-full bg-[#C7AE6A33] px-2 py-1 text-xs text-[#C7AE6A]">
                        {readableCat(d.categoria)}
                      </span>
                    </div>
                    <hr className="text-[#C7AE6A33] my-1" />
                  </div>
                  {d.descrizione && (
                    <Paragraph size="sm" className="mt-1 line-clamp-3">
                      {d.descrizione}
                    </Paragraph>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="md"
                      variant="secondary"
                      className="h-9 px-3"
                      onClick={() => {
                        onSelect(d);
                        onClose();
                      }}
                    >
                      Seleziona
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

// ───────────── Helpers UI ─────────────
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
