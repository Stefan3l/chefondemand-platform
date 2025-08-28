"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "@/utils/useTranslation";
import { api } from "@/lib/axios";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import ReactCountryFlag from "react-country-flag";
import { ChevronDown, Check } from "lucide-react";

/* ---------------- Tipuri API (strict, fără any) ---------------- */
type ChefProfile = {
  bio?: string | null;
  website?: string | null;
  languages?: string[] | null; // ex: ["it","en"]
} | null;

type MeData = {
  id: string;
  firstName: string;
  lastName?: string | null;
  countryCode: string;   // ex: "IT"
  phonePrefix: string;   // ex: "+39" sau "39"
  phoneNumber: string;   // doar cifre
  email: string;
  profile?: {
    id?: string;
    profileImageUrl?: string | null;
    profileImageMime?: string | null;
    bio?: string | null;
    website?: string | null;
    languages?: string[] | null;
  } | null;
};

type MeResponse = { ok?: boolean; data?: MeData } | MeData;

type SavePayload = {
  firstName: string;
  lastName?: string | null;
  email: string;
  countryCode: Country;
  phonePrefix: string; // cu "+"
  phoneNumber: string; // doar cifre
  bio?: string | null;
  website?: string | null;
  languages?: string[]; // ["it","en",...]
};

/* ---------------- UI helpers ---------------- */
function Section({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-[0_0_0_1px_rgba(199,174,106,0.07)]">
      {children}
    </div>
  );
}

/* map UI -> cod ISO 639-1 */
const LANG_KEY_TO_CODE = {
  spanish: "es",
  french: "fr",
  portuguese: "pt",
  english: "en",
  german: "de",
  italian: "it",
} as const;
type LangKey = keyof typeof LANG_KEY_TO_CODE;
const languageKeys = Object.keys(LANG_KEY_TO_CODE) as LangKey[];

function toLangKeys(values: unknown): Set<LangKey> {
  const out = new Set<LangKey>();
  if (!Array.isArray(values)) return out;
  for (const raw of values) {
    const v = String(raw).toLowerCase();
    const add = (k: LangKey) => out.add(k);
    if (["es", "español", "spanish", "espanol"].includes(v)) add("spanish");
    else if (["fr", "français", "french", "francais"].includes(v)) add("french");
    else if (["pt", "português", "portuguese", "portugues"].includes(v)) add("portuguese");
    else if (["en", "english", "inglese", "ingles"].includes(v)) add("english");
    else if (["de", "deutsch", "german"].includes(v)) add("german");
    else if (["it", "italiano", "italian"].includes(v)) add("italian");
  }
  return out;
}
function fromKeysToCodes(set: Set<LangKey>): string[] {
  return Array.from(set).map((k) => LANG_KEY_TO_CODE[k]);
}

/* normalizează /api/chefs/me indiferent dacă vine direct body sau {ok,data} */
function normalizeMe(x: unknown): MeData | null {
  if (!x || typeof x !== "object") return null;
  const root = x as Record<string, unknown>;
  const candidate = (root.data as MeData) ?? (x as MeData);
  if (!candidate || typeof candidate !== "object") return null;
  if (!candidate.id) return null;
  return candidate;
}

export default function InfoPersonali() {
  const { t } = useTranslation("profileInfo");

  /* ------------ state formular ------------ */
  const [chefId, setChefId] = useState<string>("");

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>(""); // opțional
  const [email, setEmail] = useState<string>("");

  const [country, setCountry] = useState<Country>("IT");
  const [prefix, setPrefix] = useState<string>("39"); // fără "+"
  const [localNumber, setLocalNumber] = useState<string>("");

  const [bio, setBio] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [langs, setLangs] = useState<Set<LangKey>>(new Set());

  /* ------------ dropdown țări ------------ */
  const [countries, setCountries] = useState<Country[]>([]);
  const [openDrop, setOpenDrop] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const dropRef = useRef<HTMLDivElement | null>(null);

  /* ------------ feedback save ------------ */
  const [saving, setSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // auto-hide mesaj în 3 secunde
  useEffect(() => {
    if (!status) return;
    const id = window.setTimeout(() => setStatus(null), 3000);
    return () => window.clearTimeout(id);
  }, [status]);

  /* ------------ helpers bio ------------ */
  const maxBio = 400;
  const minBio = 40;
  const bioPlaceholder = t("profileInfo.placeholders.bio").replace("{{min}}", String(minBio));
  const counterText = t("profileInfo.ui.counter")
    .replace("{{current}}", String(bio.length))
    .replace("{{max}}", String(maxBio));

  /* ------------ input styles ------------ */
  const inputBase =
    "w-full rounded-xl bg-neutral-900 border border-neutral-800/80 px-3 py-2 text-neutral-100 placeholder-neutral-500 " +
    "hover:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#C7AE6A33] focus:border-[#C7AE6A33] transition";
  const labelBase = "text-sm text-neutral-300 mb-1";

  /* ------------ countries & prefix ------------ */
  useEffect(() => {
    const all = (getCountries() ?? []) as Country[];
    const pinned: Country[] = ["IT"];
    const rest = all.filter((c) => !pinned.includes(c));
    setCountries([...pinned, ...rest]);
  }, []);
  useEffect(() => {
    try {
      const cc = getCountryCallingCode(country);
      setPrefix(String(cc));
    } catch {
      /* no-op */
    }
  }, [country]);
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

  const regionName = (code: Country): string => {
    try {
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      return (dn.of(code) ?? code) as string;
    } catch {
      return code;
    }
  };
  const filtered = useMemo<Country[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const name = regionName(c).toLowerCase();
      const dial = getCountryCallingCode(c);
      return name.includes(q) || c.toLowerCase().includes(q) || dial.includes(q.replace(/^\+/, ""));
    });
  }, [countries, query]);

  /* ------------ fetch /me (unica sursă de adevăr pentru prefill) ------------ */
  async function fetchMe(): Promise<void> {
    try {
      const res = await api.get<MeResponse>("/api/chefs/me", { validateStatus: () => true });
      if (res.status !== 200) return;
      const me = normalizeMe(res.data);
      if (!me) return;

      setChefId(me.id);
      setFirstName(me.firstName ?? "");
      setLastName(me.lastName ?? "");
      setEmail(me.email ?? "");
      setCountry(((me.countryCode ?? "IT").toUpperCase() as Country) || "IT");
      setPrefix(String((me.phonePrefix ?? "39").toString().replace(/^\+/, "")));
      setLocalNumber(me.phoneNumber ?? "");

      const p: ChefProfile = me.profile ?? null;
      setBio((p?.bio ?? "") || "");
      setWebsite((p?.website ?? "") || "");
      setLangs(toLangKeys(p?.languages ?? []));
    } catch {
      // lăsăm formularul gol dacă eșuează
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  /* ------------ validări minime ------------ */
  const emailRe = /\S+@\S+\.\S+/;
  const emailInvalid = email.length > 0 && !emailRe.test(email);

  /* ------------ SAVE ------------ */
  async function onSave(): Promise<void> {
    // doar nume, email, telefon sunt obligatorii (cognome, bio, site, limbi — opționale)
    if (!firstName.trim()) {
      setStatus({ kind: "err", msg: t("profileInfo.errors.firstNameRequired") || "First name is required." });
      return;
    }
    if (!emailRe.test(email)) {
      setStatus({ kind: "err", msg: t("profileInfo.errors.emailInvalid") || "Invalid email." });
      return;
    }
    if (!localNumber.trim()) {
      setStatus({ kind: "err", msg: t("profileInfo.errors.phoneRequired") || "Phone number is required." });
      return;
    }
    if (!chefId) {
      setStatus({ kind: "err", msg: "Missing chef id." });
      return;
    }

    const payload: SavePayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim() ? lastName.trim() : null,
      email: email.trim(),
      countryCode: country,
      phonePrefix: `+${prefix}`,
      phoneNumber: localNumber,
      bio: bio.trim() ? bio.trim() : null,
      website: website.trim() ? website.trim() : null,
      languages: fromKeysToCodes(langs),
    };

    setSaving(true);
    try {
      // prefer PATCH (contract parțial); fallback la PUT dacă serverul nu îl expune
      let res = await api.patch<{ ok?: boolean; message?: string }>(`/api/chefs/${chefId}/profile`, payload, {
        validateStatus: () => true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 404 || res.status === 405) {
        res = await api.put<{ ok?: boolean; message?: string }>(`/api/chefs/${chefId}/profile`, payload, {
          validateStatus: () => true,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (res.status >= 200 && res.status < 300) {
        setStatus({ kind: "ok", msg: res.data?.message || t("profileInfo.messages.saved") || "Saved." });
        // refacem /me ca să reflecte exact DB (inclusiv telefon)
        await fetchMe();
      } else {
        setStatus({ kind: "err", msg: res.data?.message || t("profileInfo.messages.saveError") || "Save failed." });
      }
    } catch (e) {
      setStatus({
        kind: "err",
        msg: e instanceof Error ? e.message : t("profileInfo.messages.saveError") || "Network error.",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ------------ UI (layout neschimbat) ------------ */
  return (
    <div className="px-2 py-6 text-neutral-100 mt-4 mb-8 lg:mb-2">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-wide">{t("profileInfo.pageTitle")}</h1>
        <hr className="border-t border-[#C7AE6A33] mt-4" />
      </div>

      <Section>
        <div className="px-5 py-4 border-b border-neutral-800">
          <h2 className="text-base font-medium text-[#C7AE6A]">{t("profileInfo.sectionTitle")}</h2>
        </div>

        <form className="p-5 space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Nume / Prenume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className={labelBase}>
                {t("profileInfo.labels.firstName")} <span className="text-[#C7AE6A]">{t("profileInfo.ui.requiredMark")}</span>
              </label>
              <input
                type="text"
                placeholder={t("profileInfo.placeholders.firstName")}
                className={inputBase}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>

            <div className="flex flex-col">
              <label className={labelBase}>
                {t("profileInfo.labels.lastName")}
              </label>
              <input
                type="text"
                placeholder={t("profileInfo.placeholders.lastName")}
                className={inputBase}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email / Telefon */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                  inputBase + (emailInvalid ? " !border-red-500/60 focus:!ring-red-500 focus:!border-red-500" : "")
                }
              />
            </div>

            {/* Telefon + prefix (grup unitar) */}
            <div className="flex flex-col">
              <label className={labelBase}>
                {t("profileInfo.labels.phone")} <span className="text-[#C7AE6A]">{t("profileInfo.ui.requiredMark")}</span>
              </label>

              <div className="relative" ref={dropRef}>
                <div className="flex h-11 rounded-2xl border border-neutral-800/80 bg-neutral-900 overflow-hidden hover:border-neutral-600 focus-within:ring-2 focus-within:ring-[#C7AE6A33] focus-within:border-[#C7AE6A33] transition">
                  {/* Buton steag + săgeată */}
                  <button
                    type="button"
                    onClick={() => setOpenDrop((s) => !s)}
                    className="px-3 inline-flex items-center gap-1 text-neutral-100 hover:bg-neutral-800"
                    aria-label={t("profileInfo.actions.changeCountry")}
                    title={country}
                  >
                    <ReactCountryFlag countryCode={country} svg aria-label={country} title={country} className="w-5 h-4 rounded" />
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

                  {/* Număr local — doar cifre */}
                  <input
                    aria-label={t("profileInfo.labels.phone")}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel"
                    placeholder={t("profileInfo.placeholders.phoneNumber")}
                    value={localNumber}
                    maxLength={20}
                    onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
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

          {/* Bio */}
          <div className="flex flex-col">
            <label className={labelBase}>
              {t("profileInfo.labels.bio")}
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

          {/* Website */}
          <div className="flex flex-col">
            <label className={labelBase}>{t("profileInfo.labels.website")}</label>
            <input
              type="url"
              placeholder={t("profileInfo.placeholders.website")}
              className={inputBase}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              autoComplete="url"
            />
          </div>

          {/* Limbi vorbite */}
          <div className="flex flex-col">
            <label className={labelBase}>{t("profileInfo.labels.languages")}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {languageKeys.map((key) => (
                <label key={key} className="flex items-center gap-3 rounded-xl border border-neutral-800/80 bg-neutral-900 px-3 py-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded-sm bg-neutral-900 border-neutral-700 accent-[#C7AE6A] focus:outline-none focus:ring-2 focus:ring-[#C7AE6A]"
                    checked={langs.has(key)}
                    onChange={(e) => {
                      setLangs((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(key);
                        else next.delete(key);
                        return next;
                      });
                    }}
                  />
                  <span className="text-sm text-neutral-200">{t(`profileInfo.languages.${key}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions + status */}
          <div className="flex items-center justify-center py-4">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-full px-6 font-medium text-neutral-900
                         bg-[#C7AE6A] hover:bg-[#bfa45e] active:bg-[#ac9557] transition shadow-[0_0_0_3px_rgba(199,174,106,0.15)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? t("profileInfo.actions.saving") || "Saving..." : t("profileInfo.actions.save")}
            </button>
          </div>

          {status && (
            <p
              className={`text-center text-sm ${status.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}
              role="status"
              aria-live="polite"
            >
              {status.msg}
            </p>
          )}
        </form>
      </Section>
    </div>
  );
}
