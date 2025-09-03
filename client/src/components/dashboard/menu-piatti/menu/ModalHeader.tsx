"use client";

import React from "react";
import { X } from "lucide-react";

/** Intestazione modale minimale: titolo + bottone chiudi */
export default function ModalHeader({
  title,
  onClose,
}: {
  title: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
      <button
        className="rounded-lg p-1 hover:bg-neutral-800"
        aria-label="Chiudi"
        onClick={onClose}
        title="Chiudi"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
