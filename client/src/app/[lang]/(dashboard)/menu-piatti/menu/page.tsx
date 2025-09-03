// src/app/chef/menu/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { useMe } from "@/context/me";
import { Button, Heading, Paragraph } from "@/components/ui";
import { Plus, Pencil, Trash2, BookOpen, Loader2, X } from "lucide-react";

// Modali riutilizzabili (posizionate in components/dashboard/menu-piatti/menu)
import MenuEditorModal from "@/components/dashboard/menu-piatti/menu/MenuEditorModal";
import ModalShell from "@/components/dashboard/menu-piatti/menu/ModalShell";

/* ───────────────────── Tipi dominio (coerenti col backend) ───────────────────── */
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

type DishCategory = "ANTIPASTO" | "PRIMO_PIATTO" | "PIATTO_PRINCIPALE" | "DESSERT" | "ALTRO";

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
type ApiDeleteResponse = void | { ok: true };

/* ───────────────────── Pagina MENÙ ───────────────────── */
export default function MenuPage() {
  const me = useMe();
  const chefId = me?.id ?? null;

  // lista menù e contatori piatti
  const [menus, setMenus] = useState<Menu[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // UI stato
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // editor modale (create/edit)
  type EditorState =
    | { open: false }
    | { open: true; mode: "create" }
    | { open: true; mode: "edit"; menu: Menu };
  const [editor, setEditor] = useState<EditorState>({ open: false });

  // dialog elimina
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  /* ───────────────── Caricamento menù ───────────────── */
  const loadMenus = useCallback(async () => {
    if (!chefId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiListResponse<Menu[]>>(`/api/chefs/${chefId}/menus`, {
        validateStatus: () => true,
      });
      if (res.status === 200 && res.data?.data) {
        setMenus(res.data.data);
        setLoadedOnce(true);
      } else {
        setError("Impossibile caricare i menù");
        setLoadedOnce(true);
      }
    } catch {
      setError("Impossibile caricare i menù");
      setLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  // conteggi piatti per ogni menù (per la card)
  useEffect(() => {
    if (!chefId || menus.length === 0) return;
    (async () => {
      const entries = await Promise.all(
        menus.map(async (m) => {
          try {
            const r = await api.get<ApiListResponse<MenuDish[]>>(
              `/api/chefs/${chefId}/menus/${m.id}/dishes`,
              { validateStatus: () => true }
            );
            if (r.status === 200 && r.data?.data) return [m.id, r.data.data.length] as const;
          } catch {}
          return [m.id, 0] as const;
        })
      );
      const map: Record<string, number> = {};
      for (const [id, n] of entries) map[id] = n;
      setCounts(map);
    })().catch(() => {});
  }, [chefId, menus]);

  // toast auto-hide
  useEffect(() => {
    if (!error && !success) return;
    const id = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
    return () => clearTimeout(id);
  }, [error, success]);

  /* ───────────────── Azioni UI ───────────────── */
  const openCreate = () => setEditor({ open: true, mode: "create" });
  const openEdit = (m: Menu) => setEditor({ open: true, mode: "edit", menu: m });
  const closeEditor = () => setEditor({ open: false });

  const confirmDelete = async () => {
    if (!chefId || !deleteId) return;
    setBusyDelete(true);
    try {
      const res = await api.delete<ApiDeleteResponse>(`/api/chefs/${chefId}/menus/${deleteId}`, {
        validateStatus: () => true,
      });
      if (res.status !== 204) throw new Error("Eliminazione fallita");
      setSuccess("Menù eliminato");
      setDeleteId(null);
      await loadMenus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eliminazione fallita");
    } finally {
      setBusyDelete(false);
    }
  };

  const showEmpty = loadedOnce && menus.length === 0;

  return (
    <div className="min-h-dvh bg-neutral-900 text-neutral-100 px-4 mb-20 lg:mb-0">
      {/* Header */}
      <div className="py-6 flex flex-col gap-2 sm:flex-row sm:gap-0 items-start sm:items-center sm:justify-between">
        <Heading level="h1" className="text-2xl font-semibold tracking-wide">
          I miei menù
        </Heading>
        <div className="flex items-center gap-3">
          {loading && <Loader2 className="h-5 w-5 animate-spin text-neutral-400" aria-label="Caricamento" />}
          <Button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4"
            onClick={openCreate}
            disabled={!chefId}
            title="Crea menù"
          >
            <span className="flex items-center gap-1 font-semibold">
              <Plus strokeWidth={3} />
              Crea menù
            </span>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {showEmpty && (
        <div className="rounded-2xl border border-[#C7AE6A33] bg-neutral-900/50 p-10 py-20 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 lg:h-24 lg:w-24 items-center justify-center rounded-full bg-[#C7AE6A1A]">
            <BookOpen className="h-8 w-8 lg:h-12 lg:w-12 text-[#C7AE6A]" />
          </div>
          <Heading level="h3" className="font-semibold text-white">
            Non hai ancora creato nessun menù
          </Heading>
          <Paragraph size="sm" className="mt-2 text-sm text-neutral-400">
            Crea il tuo primo menù e organizza i tuoi piatti in proposte complete.
          </Paragraph>
          <div className="mt-6 flex justify-center">
            <Button className="h-10 px-5" onClick={openCreate}>
              <span className="flex items-center gap-1 font-semibold">
                <Plus strokeWidth={3} />
                Crea il tuo primo menù
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Lista menù */}
      {!showEmpty && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {menus.map((m) => (
            <li
              key={m.id}
              className="overflow-hidden rounded-2xl border border-[#C7AE6A33] bg-neutral-900/50 p-5
                         transform-gpu transition-[transform,border-color,box-shadow] duration-300 ease-out
                         hover:-translate-y-0.5 hover:border-[#C7AE6A] hover:shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
            >
              <h3 className="text-base md:text-lg font-semibold">{m.nome}</h3>
              {m.descrizione && (
                <Paragraph size="sm" className="mt-2 text-neutral-300 line-clamp-3">
                  {m.descrizione}
                </Paragraph>
              )}
              <div className="mt-3 text-sm text-neutral-400">{counts[m.id] ?? 0} piatti</div>

              <hr className="border-t border-[#C7AE6A33] my-4" />

              <div className="mt-auto flex items-center justify-between gap-3">
                <Button
                  size="md"
                  variant="secondary"
                  className="h-9 px-3 inline-flex items-center gap-2 rounded-lg"
                  onClick={() => openEdit(m)}
                >
                  <Pencil className="h-4 w-4" />
                  Modifica
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  className="h-9 px-3 inline-flex items-center gap-2 rounded-lg hover:text-red-400 hover:border-red-400"
                  onClick={() => setDeleteId(m.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Toast */}
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

      {/* Modale editor (create/edit) — responsive e con scroll-y su mobile */}
      {editor.open && (
        <MenuEditorModal
          open={editor.open}
          mode={editor.mode}
          chefId={chefId ?? ""}
          menu={editor.mode === "edit" ? editor.menu : undefined}
          onClose={closeEditor}
          onSaved={() => {
            setSuccess(editor.mode === "create" ? "Menù creato" : "Menù aggiornato");
            void loadMenus();
          }}
          onToast={(kind, message) => {
            if (kind === "success") setSuccess(message);
            else setError(message);
          }}
        />
      )}

      {/* Dialog eliminazione — usa ModalShell per coerenza */}
      {!!deleteId && (
        <ModalShell open={true} onClose={() => setDeleteId(null)} ariaLabel="Elimina menù" maxWidth="sm">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-semibold">Elimina menù</h4>
            <button
              className="rounded-lg p-1 hover:bg-neutral-800"
              onClick={() => setDeleteId(null)}
              aria-label="Chiudi"
              title="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-2 text-sm text-neutral-300">
            Sei sicuro di voler eliminare questo menù? L’azione non può essere annullata.
          </p>

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={busyDelete}>
              Annulla
            </Button>
            <Button onClick={confirmDelete} disabled={busyDelete}>
              {busyDelete ? "Attendere…" : "Elimina"}
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
