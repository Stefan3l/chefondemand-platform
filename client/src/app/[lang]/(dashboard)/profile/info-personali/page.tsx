// src/app/profile/info-personali/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTranslation } from "@/utils/useTranslation";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import ReactCountryFlag from "react-country-flag";
import { ChevronDown, Check } from "lucide-react";

/* Card wrapper */
function Section({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-[0_0_0_1px_rgba(199,174,106,0.07)]">
      {children}
    </div>
  );
}

export default function InfoPersonali() {
  const { t } = useTranslation("profileInfo");

  // Email (controlat) + validare simplă
  const [email, setEmail] = useState("");
  const emailRe = /\S+@\S+\.\S+/;
  const emailInvalid = email.length > 0 && !emailRe.test(email);

  // Bio
  const [bio, setBio] = useState("");
  const maxBio = 400;
  const minBio = 40;

  // Texte dinamice
  const bioPlaceholder = t("profileInfo.placeholders.bio").replace("{{min}}", String(minBio));
  const counterText = t("profileInfo.ui.counter")
    .replace("{{current}}", String(bio.length))
    .replace("{{max}}", String(maxBio));

  // Clase comune
  const inputBase =
    "w-full rounded-xl bg-neutral-900 border border-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-500 " +
    "hover:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#C7AE6A33] focus:border-[#C7AE6A33] transition";
  const labelBase = "text-sm text-neutral-300 mb-1";

  const languageKeys = ["spanish", "french", "portuguese", "english", "german", "italian"] as const;

  /* ───────────────── Telefon cu prefix (în stil RegisterChef) ───────────────── */
  const [country, setCountry] = useState<Country>("IT");
  const [prefix, setPrefix] = useState<string>("39"); // fără "+"
  const [localNumber, setLocalNumber] = useState<string>(""); // doar cifre

  const [countries, setCountries] = useState<Country[]>([]);
  const [openDrop, setOpenDrop] = useState(false);
  const [query, setQuery] = useState("");
  const dropRef = useRef<HTMLDivElement | null>(null);

  // Populare listă țări (Italia prima)
  useEffect(() => {
    const all = (getCountries() ?? []) as Country[];
    const pinned: Country[] = ["IT"];
    const rest = all.filter((c) => !pinned.includes(c));
    setCountries([...pinned, ...rest]);
  }, []);

  // Update prefix la schimbarea țării
  useEffect(() => {
    try {
      const cc = getCountryCallingCode(country);
      setPrefix(String(cc));
    } catch {
      /* no-op */
    }
  }, [country]);

  // Închide dropdown la click în afară
  useEffect(() => {
    if (!openDrop) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpenDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDrop]);

  const regionName = (code: Country) => {
    try {
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      return (dn.of(code) ?? code) as string;
    } catch {
      return code;
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const name = regionName(c).toLowerCase();
      const dial = getCountryCallingCode(c);
      return name.includes(q) || c.toLowerCase().includes(q) || dial.includes(q.replace(/^\+/, ""));
    });
  }, [countries, query]);

  /* ───────────────── UI ───────────────── */
  return (
    <div className="px-2 py-6 text-neutral-100 mt-4 mb-8 lg:mb-2">
      {/* Titlu pagină */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-wide">{t("profileInfo.pageTitle")}</h1>
        <hr className="border-t border-[#C7AE6A33] mt-4" />
      </div>

      <Section>
        {/* Header card */}
        <div className="px-5 py-4 border-b border-neutral-800">
          <h2 className="text-base font-medium text-[#C7AE6A]">{t("profileInfo.sectionTitle")}</h2>
        </div>

        {/* Conținut card */}
        <form className="p-5 space-y-6">
          {/* Nume / Prenume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className={labelBase}>
                {t("profileInfo.labels.firstName")} <span className="text-[#C7AE6A]">{t("profileInfo.ui.requiredMark")}</span>
              </label>
              <input type="text" placeholder={t("profileInfo.placeholders.firstName")} className={inputBase} />
            </div>

            <div className="flex flex-col">
              <label className={labelBase}>
                {t("profileInfo.labels.lastName")} <span className="text-[#C7AE6A]">{t("profileInfo.ui.requiredMark")}</span>
              </label>
              <input type="text" placeholder={t("profileInfo.placeholders.lastName")} className={inputBase} />
            </div>
          </div>

          {/* Email / Telefon */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Email controlat + validare */}
            <div className="flex flex-col">
              <label className={labelBase}>
                {t("profileInfo.labels.email")} <span className="text-[#C7AE6A]">{t("profileInfo.ui.requiredMark")}</span>
              </label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t("profileInfo.placeholders.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={emailInvalid || undefined}
                className={
                  inputBase +
                  (emailInvalid
                    ? " !border-red-500/60 focus:!ring-red-500 focus:!border-red-500"
                    : "")
                }
              />
            </div>

            {/* Telefon cu prefix – container elegant, prefix mic, număr mare */}
            <div className="flex flex-col">
              <label className={labelBase}>{t("profileInfo.labels.phone")}</label>

              <div className="relative" ref={dropRef}>
                {/* Grup unitar cu o singură bordură + același hover/focus ca inputBase */}
                <div className="flex h-11 rounded-2xl border border-neutral-800/80 bg-neutral-900 overflow-hidden hover:border-neutral-600 focus-within:ring-2 focus-within:ring-[#C7AE6A33] focus-within:border-[#C7AE6A33] transition">
                  {/* Trigger dropdown: steag + săgeată */}
                  <button
                    type="button"
                    onClick={() => setOpenDrop((s) => !s)}
                    className="px-3 inline-flex items-center gap-1 text-neutral-100 hover:bg-neutral-800"
                    aria-label={t("profileInfo.actions.changeCountry")}
                    title={country}
                  >
                    <ReactCountryFlag
                      countryCode={country}
                      svg
                      aria-label={country}
                      title={country}
                      className="w-5 h-4 rounded"
                    />
                    <ChevronDown size={14} className="opacity-70" />
                  </button>

                  {/* Prefix compact (readonly) */}
                  <input
                    aria-label={t("profileInfo.labels.phonePrefix")}
                    value={`+${prefix}`}
                    readOnly
                    onClick={() => setOpenDrop(true)}
                    className="w-[76px] px-2 text-center tabular-nums bg-transparent text-neutral-100 outline-none border-0"
                  />

                  {/* Număr local – doar cifre, ocupă restul spațiului */}
                  <input
                    aria-label={t("profileInfo.labels.phone")}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel"
                    placeholder={t("profileInfo.placeholders.phoneNumber")}
                    value={localNumber}
                    maxLength={15}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "");
                      setLocalNumber(digitsOnly);
                    }}
                    className="flex-1 px-1 md:px-3 bg-transparent text-neutral-100 outline-none border-0"
                  />
                </div>

                {/* Dropdown țări/prefixe */}
                {openDrop && (
                  <div className="absolute z-50 mt-2 w-[min(92vw,28rem)] max-w-[18rem] lg:max-w-[28rem] rounded-2xl border border-neutral-800 bg-neutral-900 shadow-xl">
                    <div className="p-3 border-b border-neutral-800">
                      <input
                        className={inputBase}
                        placeholder={t("profileInfo.placeholders.searchCountry")}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <ul className="max-h-80 overflow-y-auto divide-y divide-neutral-800">
                      {filtered.map((c) => {
                        const dial = getCountryCallingCode(c);
                        const selected = c === country;
                        return (
                          <li key={c}>
                            <button
                              type="button"
                              onClick={() => {
                                setCountry(c);
                                setOpenDrop(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-left text-neutral-200 hover:bg-neutral-800"
                            >
                              <ReactCountryFlag countryCode={c} svg aria-label={c} title={c} className="w-6 h-4 rounded" />
                              <span className="flex-1 text-sm">{regionName(c)}</span>
                              <span className="text-xs font-medium opacity-80">+{dial}</span>
                              {selected && <Check size={16} className="opacity-80" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Biografie */}
          <div className="flex flex-col">
            <label className={labelBase}>
              {t("profileInfo.labels.bio")} <span className="text-[#C7AE6A]">{t("profileInfo.ui.requiredMark")}</span>
            </label>
            <textarea
              className={`${inputBase} min-h-[120px] resize-y`}
              placeholder={bioPlaceholder}
              maxLength={maxBio}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div className="mt-1 text-xs text-neutral-500">{counterText}</div>
          </div>

          {/* Site web */}
          <div className="flex flex-col">
            <label className={labelBase}>{t("profileInfo.labels.website")}</label>
            <input type="url" placeholder={t("profileInfo.placeholders.website")} className={inputBase} />
          </div>

          {/* Limbi vorbite */}
          <div className="flex flex-col">
            <label className={labelBase}>{t("profileInfo.labels.languages")}</label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {languageKeys.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="size-4 rounded-sm bg-neutral-900 border-neutral-700 accent-[#C7AE6A] focus:outline-none focus:ring-2 focus:ring-[#C7AE6A]"
                  />
                  <span className="text-sm text-neutral-200">{t(`profileInfo.languages.${key}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center py-4">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full px-6 font-medium text-neutral-900
                         bg-[#C7AE6A] hover:bg-[#bfa45e] active:bg-[#ac9557] transition shadow-[0_0_0_3px_rgba(199,174,106,0.15)]"
            >
              {t("profileInfo.actions.save")}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
