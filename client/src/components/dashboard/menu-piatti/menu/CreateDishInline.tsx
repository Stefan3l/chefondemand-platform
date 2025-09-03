"use client";

import React from "react";
import { Button } from "@/components/ui";
import { Loader2, Plus } from "lucide-react";

/** Piccolo form inline per creare velocemente un piatto nella stessa categoria. */
export default function CreateDishInline({
  categoryLabel,
  newName,
  setNewName,
  newDesc,
  setNewDesc,
  creating,
  onCreate,
}: {
  categoryLabel: string;
  newName: string;
  setNewName: (v: string) => void;
  newDesc: string;
  setNewDesc: (v: string) => void;
  creating: boolean;
  onCreate: () => void;
}) {
  return (
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
            value={categoryLabel}
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
        <Button className="h-10 px-5" onClick={onCreate} disabled={creating}>
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
  );
}
