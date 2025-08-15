
"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";

const base =
  "w-full h-11 rounded-2xl border px-4 text-sm outline-none transition " +
  "bg-neutral-800 text-neutral-100 placeholder-neutral-500 border-neutral-700 " +
  "focus:ring-2 focus:ring-[#C7AE6A] focus:border-transparent";

const DarkTextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className, ...props }, ref) => <input ref={ref} className={`${base} ${className ?? ""}`} {...props} />
);
DarkTextInput.displayName = "DarkTextInput";

export default DarkTextInput;
