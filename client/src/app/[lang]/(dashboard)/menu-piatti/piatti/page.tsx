// src/app/chef/piatti/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/axios";
import { Button, Heading, Paragraph } from "@/components/ui";
import { useMe } from "@/context/me";
import { useTranslation } from "@/utils/useTranslation";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

/* ───────────────────────── Tipi dominio ───────────────────────── */

type DishCategory = "ANTIPASTO" | "PRIMO_PIATTO" | "PIATTO_PRINCIPALE" | "DESSERT" | "ALTRO";

type Dish = {
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
type ApiDeleteResponse = void | { ok: true };

const CATEGORY_VALUES: DishCategory[] = [
  "ANTIPASTO",
  "PRIMO_PIATTO",
  "PIATTO_PRINCIPALE",
  "DESSERT",
  "ALTRO",
];

/* ───────────────── FancySelect: select custom stilizzabile ─────────────────
   - Serve per avere la lista delle opzioni con bg nero, testo #C7AE6A e bordo #C7AE6A33
   - Accessibile: tastiera ↑/↓/Enter/Esc, focus, chiusura click fuori
   - Riutilizzato sia nell’header (filtro) sia nella modale (categoria)
----------------------------------------------------------------------------- */

type Option<T extends string> = { value: T; label: string };

type FancySelectProps<T extends string> = {
  value: T;
  onChange: (val: T) => void;
  options: Option<T>[];
  "aria-label"?: string;
  className?: string;
};

function FancySelect<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className = "",
}: FancySelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(() =>
    Math.max(0, options.findIndex((o) => o.value === value))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null); // ← Manteniamo un ref del trigger per gestire il focus dopo la selezione

  // chiusura a click fuori
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // mantieni focusIndex allineato al value
  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setFocusIndex(idx);
  }, [value, options]);

  const currentLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value]
  );

  const select = (v: T) => {
    onChange(v);
    setOpen(false);
    // Evita riaperture involontarie: togli il focus al trigger subito dopo la scelta
    setTimeout(() => {
      triggerRef.current?.blur();
    }, 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, options.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[focusIndex];
      if (opt) select(opt.value);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef} // ← Ref per gestire il blur post-selezione
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className="w-full appearance-none rounded-full border border-[#C7AE6A33] bg-neutral-900/80 px-4 py-2 pr-8 text-left text-sm outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
      >
        <span>{currentLabel}</span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
          ▾
        </span>
      </button>

      {/* Panel opzioni */}
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#C7AE6A33] bg-neutral-900 text-white shadow-[0_10px_24px_rgba(0,0,0,0.5)]"
        >
          {options.map((opt, idx) => {
            const active = value === opt.value;
            const focused = idx === focusIndex;
            return (
              <button
                key={opt.value}
                role="option"
                aria-selected={active}
                type="button"
                onMouseEnter={() => setFocusIndex(idx)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // ← Impedisce il bubbling verso il trigger che potrebbe riaprire il menu
                  select(opt.value);
                }}
                className={[
                  "block w-full px-3 py-2 text-left text-sm transition",
                  active ? "bg-[#C7AE6A22]" : "",
                  focused ? "bg-[#C7AE6A11]" : "",
                  "hover:bg-[#C7AE6A11] focus:bg-[#C7AE6A11] focus:outline-none",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Pagina Piatti ───────────────────────── */

export default function Piatti() {
  // Traduzioni (manteniamo helper per chiavi namespaced)
  const { t } = useTranslation("dishes");
  const T = useCallback((key: string) => t(`dishes.${key}`), [t]);
  const catLabel = useCallback((cat: DishCategory) => t(`dishes.categories.${cat}`), [t]);

  const me = useMe();
  const chefId = me?.id ?? null;

  // Stato lista / UI
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtro categorie
  type Filter = "ALL" | DishCategory;
  const [filter, setFilter] = useState<Filter>("ALL");

  // Modale add/edit
  type ModalState =
    | { open: false }
    | {
        open: true;
        mode: "create" | "edit";
        dishId?: string;
        nomePiatto: string;
        categoria: DishCategory | "";
        descrizione: string;
        busy: boolean;
      };
  const [modal, setModal] = useState<ModalState>({ open: false });

  // Conferma delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  // Contatore amichevole
  const countLabel = useMemo(() => {
    const n = dishes.length;
    if (n === 0) return T("count.zero");
    if (n === 1) return T("count.one");
    return (T("count.other") || "{{count}} dishes").replace("{{count}}", String(n));
  }, [dishes.length, T]);

  // Caricamento lista (senza mettere T nelle deps per evitare refetch su cambio lingua)
  const loadDishes = useCallback(async () => {
    if (!chefId) return;
    setLoading(true);
    setError(null);
    try {
      const params = filter === "ALL" ? "" : `?category=${encodeURIComponent(filter)}`;
      const res = await api.get<ApiListResponse<Dish[]>>(`/api/chefs/${chefId}/dishes${params}`, {
        validateStatus: () => true,
      });
      if (res.status === 200 && res.data?.data) {
        setDishes(res.data.data);
        setHasLoadedOnce(true);
      } else {
        setError(T("notifications.loadError"));
        setHasLoadedOnce(true);
      }
    } catch {
      setError(T("notifications.loadError"));
      setHasLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [chefId, filter]); // INTENZIONALMENTE senza T

  useEffect(() => {
    void loadDishes();
  }, [loadDishes]);

  // Toast auto-hide 3s
  useEffect(() => {
    if (!error && !success) return;
    const id = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
    return () => clearTimeout(id);
  }, [error, success]);

  /* ──────────────── Azioni CRUD ──────────────── */

  const openCreate = () =>
    setModal({
      open: true,
      mode: "create",
      nomePiatto: "",
      categoria: "",
      descrizione: "",
      busy: false,
    });

  const openEdit = (d: Dish) =>
    setModal({
      open: true,
      mode: "edit",
      dishId: d.id,
      nomePiatto: d.nomePiatto,
      categoria: d.categoria,
      descrizione: d.descrizione ?? "",
      busy: false,
    });

  const closeModal = () => setModal({ open: false });

  const onSaveModal = async () => {
    if (!chefId || !modal.open || modal.busy) return;
    const nome = modal.nomePiatto.trim();
    const categoria = modal.categoria;
    const descrizione = modal.descrizione.trim();

    if (!nome) return setError(T("errors.nameRequired"));
    if (!categoria) return setError(T("errors.categoryRequired"));

    setModal((m) => (m.open ? { ...m, busy: true } : m));
    try {
      if (modal.mode === "create") {
        const res = await api.post<ApiOneResponse<Dish>>(
          `/api/chefs/${chefId}/dishes`,
          { nomePiatto: nome, categoria, descrizione: descrizione || null },
          { validateStatus: () => true }
        );
        if (res.status !== 201 || !res.data?.data) throw new Error(T("notifications.createFailed"));
        setSuccess(T("notifications.createOk"));
      } else {
        const res = await api.patch<ApiOneResponse<Dish>>(
          `/api/chefs/${chefId}/dishes/${modal.dishId}`,
          { nomePiatto: nome, categoria, descrizione: descrizione || null },
          { validateStatus: () => true }
        );
        if (res.status !== 200 || !res.data?.data) throw new Error(T("notifications.updateFailed"));
        setSuccess(T("notifications.updateOk"));
      }
      closeModal();
      await loadDishes();
    } catch (e) {
      setError(e instanceof Error ? e.message : T("notifications.opFailed"));
      setModal((m) => (m.open ? { ...m, busy: false } : m));
    }
  };

  const askDelete = (id: string) => setDeleteId(id);
  const closeDelete = () => setDeleteId(null);

  const confirmDelete = async () => {
    if (!chefId || !deleteId) return;
    setBusyDelete(true);
    try {
      const res = await api.delete<ApiDeleteResponse>(`/api/chefs/${chefId}/dishes/${deleteId}`, {
        validateStatus: () => true,
      });
      if (res.status !== 204) throw new Error(T("notifications.deleteFailed"));
      setSuccess(T("notifications.deleteOk"));
      setDeleteId(null);
      await loadDishes();
    } catch (e) {
      setError(e instanceof Error ? e.message : T("notifications.deleteFailed"));
    } finally {
      setBusyDelete(false);
    }
  };

  /* ──────────────── Grid card (flex + wrap, dimensioni coerenti) ────────────────
     - Usiamo flex-wrap con "basis" responsive per card di pari larghezza.
     - Altezza fissata per breakpoint: impedisce salti e mantiene allineamento.
     - Contenuti clippati (line-clamp) per evitare overflow.
  ------------------------------------------------------------------------------- */

  const showLoadingInGrid = loading && !hasLoadedOnce;

  const grid = useMemo(() => {
    if (showLoadingInGrid) {
      return <p className="text-sm text-neutral-400">{T("loading")}</p>;
    }
    if (hasLoadedOnce && dishes.length === 0) {
      return <p className="text-sm text-neutral-400">{T("empty")}</p>;
    }
    if (dishes.length === 0) return null;

    return (
      <ul className="flex flex-wrap  gap-4">
        {dishes.map((d) => (
          <li
            key={d.id}
            className="             
              overflow-hidden rounded-2xl border border-[#C7AE6A33] bg-neutral-900/50 px-6 py-8 w-full sm:w-auto
              flex flex-col          
              transform-gpu transition-[transform,border-color,box-shadow] duration-300 ease-out
              hover:-translate-y-0.5 hover:border-[#C7AE6A] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
           
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base md:text-lg font-semibold text-neutral-100 line-clamp-2 break-words">
                {d.nomePiatto}
              </h3>
            </div>

            <div className="my-2">
              <span className="inline-block rounded-full bg-[#C7AE6A33] px-2 py-1 text-xs md:text-[13px] text-[#C7AE6A]">
                {catLabel(d.categoria)}
              </span>
            </div>

            {d.descrizione && (
              <Paragraph
                size="sm"
                className="mt-3 text-neutral-300 line-clamp-4 break-words"
              >
                {d.descrizione}
              </Paragraph>
            )}

            <hr className="border-t border-[#C7AE6A33] my-4" />

            {/* Azioni fissate in basso: mt-auto spinge il blocco a fondo card */}
            <div className="mt-auto flex items-center justify-between gap-3">
              <Button
                size="md"
                variant="secondary"
                className="h-9 px-3 inline-flex items-center gap-2 rounded-lg"
                onClick={() => openEdit(d)}
              >
                <span className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  {T("buttons.edit")}
                </span>
              </Button>
              <Button
                size="md"
                variant="secondary"
                className="h-9 px-3 inline-flex items-center gap-2 rounded-lg hover:text-red-400 hover:border-red-400"
                onClick={() => askDelete(d.id)}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {T("buttons.delete")}
                </span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  }, [dishes, catLabel, T, showLoadingInGrid, hasLoadedOnce]);

  /* ──────────────── Render ──────────────── */

  // Opzioni pentru filter select (include "ALL")
  const filterOptions: Option<Filter>[] = useMemo(
    () => [
      { value: "ALL", label: T("filter.all") },
      ...CATEGORY_VALUES.map((c) => ({ value: c, label: catLabel(c) })),
    ],
    [T, catLabel]
  );

  // Placeholder pentru select din modale (categoria)
  const PLH = "__PLH__" as const;
  type ModalCatValue = DishCategory | typeof PLH;
  const modalCategoryOptions: Option<ModalCatValue>[] = useMemo(
    () => [
      { value: PLH, label: T("fields.category.placeholder") },
      ...CATEGORY_VALUES.map((c) => ({ value: c as ModalCatValue, label: catLabel(c) })),
    ],
    [T, catLabel]
  );

  return (
    <div className="min-h-dvh bg-neutral-900 text-neutral-100 px-4 mb-14 lg:mb-0">
      {/* Header */}
      <div className="py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading level="h1" className="text-2xl font-semibold tracking-wide">
            {T("pageTitle")}
          </Heading>
          <Paragraph size="sm" className="mb-2 text-neutral-500">{countLabel}</Paragraph>
        </div>

        <div className="flex flex-col  sm:flex-row items-start  gap-3 ">
          {/* Filtro con FancySelect (stesso stile richiesto) */}
          <FancySelect<Filter>
            value={filter}
            onChange={(v) => setFilter(v)}
            options={filterOptions}
            aria-label={T("filter.label")}
            className="w-full sm:min-w-[240px]"
          />

          {/* Aggiungi piatto */}
          <Button
           size="lg"
            type="button"
            variant="primary"
            className="inline-flex items-center gap-2 h-10 px-4 w-full sm:min-w-[240px]"
            onClick={openCreate}
            disabled={!chefId}
            title={undefined}
          >
            <span className="flex items-center gap-1">
              <Plus strokeWidth={3} className="w-5 h-5" />
              {T("buttons.add")}
            </span>
          </Button>

          {/* Spinner discreto durante refetch successivi */}
          {loading && hasLoadedOnce && (
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" aria-label={T("loading")} />
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="pb-10">{grid}</div>

      {/* Toast in alto a destra (3s) */}
      {(error || success) && (
        <div className="fixed top-24 right-6 z-50 space-y-2">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 shadow-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 shadow-lg">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Modale Add/Edit */}
      {modal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[#C7AE6A33] bg-neutral-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">
                {modal.mode === "create" ? T("modal.addTitle") : T("modal.editTitle")}
              </h4>
              <button
                className="rounded-lg p-1 hover:bg-neutral-800"
                onClick={closeModal}
                aria-label={T("buttons.close")}
                title={T("buttons.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="text-sm">
                {T("fields.name.label")}
                <input
                  value={modal.nomePiatto}
                  onChange={(e) => setModal((m) => (m.open ? { ...m, nomePiatto: e.target.value } : m))}
                  placeholder={T("fields.name.placeholder")}
                  className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
                />
              </label>

              <label className="text-sm">
                {T("fields.category.label")}
                {/* FancySelect ANCHE nella modale, con placeholder */}
                <div className="mt-2">
                  <FancySelect<ModalCatValue>
                    value={(modal.categoria || "__PLH__") as ModalCatValue}
                    onChange={(v) =>
                      setModal((m) =>
                        m.open
                          ? { ...m, categoria: v === "__PLH__" ? "" : (v as DishCategory) }
                          : m
                      )
                    }
                    options={[
                      { value: "__PLH__", label: T("fields.category.placeholder") },
                      ...CATEGORY_VALUES.map((c) => ({ value: c as ModalCatValue, label: catLabel(c) })),
                    ]}
                    aria-label={T("fields.category.label")}
                  />
                </div>
              </label>

              <label className="text-sm">
                {T("fields.description.label")}
                <textarea
                  value={modal.descrizione}
                  onChange={(e) => setModal((m) => (m.open ? { ...m, descrizione: e.target.value } : m))}
                  placeholder={T("fields.description.placeholder")}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:border-[#C7AE6A33] focus:ring-1 focus:ring-[#C7AE6A33]"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="secondary" onClick={closeModal} className="h-10 px-4" disabled={modal.busy}>
                {T("buttons.cancel")}
              </Button>
              <Button onClick={onSaveModal} className="h-10 px-5" disabled={modal.busy || !chefId}>
                {modal.mode === "create" ? T("buttons.save") : T("buttons.saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog eliminazione */}
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
            <h4 className="text-lg font-semibold mb-2">{T("deleteDialog.title")}</h4>
            <p className="text-sm text-neutral-300 mb-4">{T("deleteDialog.message")}</p>

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={closeDelete} disabled={busyDelete}>
                {T("buttons.cancel")}
              </Button>
              <Button onClick={confirmDelete} disabled={busyDelete}>
                {busyDelete ? T("loading") : T("buttons.deleteConfirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
