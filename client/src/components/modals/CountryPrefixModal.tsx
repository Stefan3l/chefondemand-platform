// src/components/modals/CountryPrefixModal.tsx
"use client";

import { Fragment, useMemo, useState, useEffect } from "react";
import { Dialog, DialogPanel,  Transition, TransitionChild } from "@headlessui/react";
import { X,  Check } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import {  getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import DarkTextInput from "@/components/ui/DarkTextInput";

function Flag({ code }: { code: Country }) {
  return <ReactCountryFlag countryCode={code} svg aria-label={code} title={code} className="w-6 h-4 rounded" />;
}

type Props = {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  current: Country;
  onSelect: (c: Country) => void;
  title: string;
};

export default function CountryPrefixModal({ open, onClose, countries, current, onSelect, title }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => { if (!open) setQuery(""); }, [open]);

  const countryName = (code: Country) => {
    try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; }
    catch { return code; }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const name = countryName(c).toLowerCase();
      const dial = getCountryCallingCode(c);
      return name.includes(q) || c.toLowerCase().includes(q) || dial.includes(q.replace(/^\+/, ""));
    });
  }, [countries, query]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[110]" onClose={onClose}>
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-1" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-1">
              <DialogPanel className="relative w-full max-w-xl mx-4 sm:mx-6 rounded-3xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 max-h-[90vh] p-5 sm:p-6 overflow-hidden">
                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>

                <h2 className="text-lg font-semibold text-neutral-100 pr-10">{title}</h2>

                <div className="mt-4">
                  <DarkTextInput placeholder="Search country or prefix" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>

                {/* List with hidden scrollbar */}
                <div className="mt-3 overflow-y-auto no-scrollbar max-h-[60vh] rounded-2xl border border-neutral-800">
                  <ul className="divide-y divide-neutral-800">
                    {filtered.map((c) => {
                      const dial = getCountryCallingCode(c);
                      const selected = c === current;
                      return (
                        <li key={c}>
                          <button
                            type="button"
                            onClick={() => { onSelect(c); onClose(); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-neutral-200 hover:bg-neutral-800"
                          >
                            <Flag code={c} />
                            <span className="flex-1 text-sm">{countryName(c)}</span>
                            <span className="text-xs font-medium opacity-80">+{dial}</span>
                            {selected && <Check size={16} className="opacity-80" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
