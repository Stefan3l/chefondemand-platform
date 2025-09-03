"use client";

import React, { PropsWithChildren, useEffect } from "react";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  maxWidth?: MaxWidth; // larghezza massima del pannello
  className?: string;  // classi aggiuntive del pannello
};

/**
 * Shell modale riutilizzabile:
 * - overlay scroll-y su mobile con scrollbar nascosta
 * - container con my-10 su mobile (respira sugli schermi piccoli)
 * - centratura verticale/orizzontale su desktop
 * - pannello con max-height e scroll interno (scrollbar nascosta)
 * - chiusura con ESC e click sul backdrop
 */
export default function ModalShell({
  open,
  onClose,
  ariaLabel,
  maxWidth = "3xl",
  className = "",
  children,
}: PropsWithChildren<ModalShellProps>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxWClass =
    maxWidth === "sm" ? "max-w-sm" :
    maxWidth === "md" ? "max-w-md" :
    maxWidth === "lg" ? "max-w-lg" :
    maxWidth === "xl" ? "max-w-xl" :
    maxWidth === "2xl" ? "max-w-2xl" :
    maxWidth === "3xl" ? "max-w-3xl" :
    maxWidth === "4xl" ? "max-w-4xl" :
    maxWidth === "5xl" ? "max-w-5xl" :
    "max-w-6xl";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      // overlay: scrollabile su mobile, centrato su desktop, scrollbar invisibile
      className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto scrollbar-none sm:flex sm:items-center sm:justify-center"
      onClick={onClose}
    >
      {/* container: margine verticale su mobile; su desktop centriamo via flex del parent */}
      <div className="container my-10 sm:my-0 mx-auto">
        <div
          className={[
            "w-full",
            maxWClass,
            "mx-auto rounded-2xl border border-[#C7AE6A33] bg-neutral-900 p-5 text-neutral-100",
            // pannello: altezza massima + scroll interno con scrollbar invisibile
            "max-h-[calc(100dvh-5rem)] overflow-y-auto scrollbar-none",
            className,
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
