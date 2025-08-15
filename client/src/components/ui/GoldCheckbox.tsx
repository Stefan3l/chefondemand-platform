// src/components/ui/GoldCheckbox.tsx
"use client";


type Props = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;     // label content (text/links)
  className?: string;
};

export default function GoldCheckbox({ id, checked, onChange, children, className }: Props) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer select-none items-start gap-3 text-sm text-neutral-300 ${className ?? ""}`}>
      {/* real input, visually hidden but accessible */}
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      {/* custom box */}
      <span className="relative mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border border-neutral-600 bg-neutral-800 transition-colors 
                       peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#C7AE6A] peer-checked:bg-[#C7AE6A]">
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute h-3.5 w-3.5 opacity-0 transition-opacity peer-checked:opacity-100" aria-hidden="true">
          <path d="M5 10.5l3 3 7-7" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {/* label content */}
      <span>{children}</span>
    </label>
  );
}
