"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Loader2, UtensilsCrossed } from "lucide-react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui";
import ModalShell from "@/components/dashboard/menu-piatti/menu/ModalShell";
import ModalHeader from "@/components/dashboard/menu-piatti/menu/ModalHeader";
import CreateDishInline from "./CreateDishInline";
import DishCard from "./DishCard";
import type { Dish, DishCategory, ApiListResponse, ApiOneResponse } from "./types";

/* ───────────────────────── Helpers UI ───────────────────────── */
function readableCat(c: DishCategory): string {
  switch (c) {
    case "ANTIPASTO": return "Antipasto";
    case "PRIMO_PIATTO": return "Primo piatto";
    case "PIATTO_PRINCIPALE": return "Piatto principale";
    case "DESSERT": return "Dessert";
    case "ALTRO": return "Altro";
    default: return c;
  }
}

/* ───────────────────────── Props ───────────────────────── */
type SelectDishModalProps = {
  open: boolean;
  onClose: () => void;
  chefId: string;
  category: DishCategory;
  onSelect: (dish: Dish) => void;
};

/**
 * Modale principale:
 * - Usa ModalShell (overlay scroll-y mobile + centering desktop)
 * - Header separato
 * - Form "create" inline e lista piatti modularizzate
 */
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

  const rootRef = useRef<HTMLDivElement>(null);

  // carica/elenco
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

  // create veloce
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
    <ModalShell open={open} onClose={onClose} ariaLabel="Seleziona un piatto" maxWidth="3xl">
      <div ref={rootRef}>
        {/* Header */}
        <ModalHeader
          title={<>Seleziona un piatto — {readableCat(category)}</>}
          onClose={onClose}
        />

        {/* Barra azioni: cerca + crea */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per nome…"
              className="w-full rounded-full border border-[#C7AE6A33] bg-neutral-900/80 px-10 py-2 text-sm placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
            />
            {/* icona di ricerca */}
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <Button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4"
            onClick={() => setShowCreate((v) => !v)}
            title={showCreate ? "Chiudi creazione" : "Crea nuovo piatto"}
          >
            <Plus className="h-4 w-4" />
            {showCreate ? "Chiudi" : "Crea nuovo piatto"}
          </Button>
        </div>

        {/* Quick create inline */}
        {showCreate && (
          <CreateDishInline
            categoryLabel={readableCat(category)}
            newName={newName}
            setNewName={setNewName}
            newDesc={newDesc}
            setNewDesc={setNewDesc}
            creating={creating}
            onCreate={onCreateDish}
          />
        )}

        {/* Stato/errori */}
        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Lista piatti (il pannello ha già scroll-y con scrollbar nascosta) */}
        <div className="mt-4 max-h-[50vh] overflow-auto scrollbar-none pr-1">
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
                <DishCard
                  key={d.id}
                  dish={d}
                  categoryLabel={readableCat(d.categoria)}
                  onPick={(dish) => {
                    onSelect(dish);
                    onClose();
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
