"use client";

import { Fragment, type ReactNode } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { X } from "lucide-react";
import { Heading } from "@/components/ui";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Extra classes for the DialogPanel if you need custom spacing in a screen */
  panelClassName?: string;
};

export default function ModalShell({ open, onClose, title, subtitle, children, panelClassName }: Props) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        {/* overlay, always dark */}
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-1" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-1">
              <DialogPanel
                className={`relative w-full max-w-md sm:max-w-xl mx-4 sm:mx-6 rounded-3xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 
                            max-h-[90vh] overflow-y-auto no-scrollbar p-5 sm:p-6 ${panelClassName ?? ""}`}
              >
                {/* Close button, pinned top-right */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>

                {/* Title (centered) */}
                <div className="text-center mb-4">
                  <DialogTitle as="div" className="sr-only">{title}</DialogTitle>
                  <Heading level="h3" className="text-2xl font-semibold text-[#C7AE6A]">
                    {title}
                  </Heading>
                  {subtitle ? <div className="mt-2 text-neutral-300">{subtitle}</div> : null}
                </div>

                {/* Content */}
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
