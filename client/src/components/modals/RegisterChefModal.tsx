// src/components/modals/RegisterChefModal.tsx
"use client";

import {
  Fragment,
  useMemo,
  useState,
  useEffect,
  forwardRef,
  type ComponentPropsWithoutRef,
} from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X, Eye, EyeOff, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import type { Country } from "react-phone-number-input";
import ReactCountryFlag from "react-country-flag";
import { Heading, Paragraph } from "@/components/ui";
import { useTranslation } from "@/utils/useTranslation";

/* ---------------- Password policy (module scope, no hook deps) ---------------- */
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]{8,72}$/;
const PASSWORD_POLICY_FALLBACK =
  "Password must be 8–72 characters, include uppercase, lowercase and a number, and contain no spaces.";

/* ---------------- API config ---------------- */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:4000";
const REG_ENDPOINT = `${API_BASE}/api/chefs/register`;

/* ---------------- Types & helpers (no `any`) ---------------- */
type ApiErrorData = { code?: string; message?: string };

function isApiErrorData(x: unknown): x is ApiErrorData {
  if (typeof x !== "object" || x === null) return false;
  const maybe = x as Record<string, unknown>;
  const okCode = maybe.code === undefined || typeof maybe.code === "string";
  const okMsg = maybe.message === undefined || typeof maybe.message === "string";
  return okCode && okMsg;
}

/* ---------------- Shared input style (dark) ---------------- */
const inputBase =
  "w-full h-11 rounded-2xl border px-4 text-sm outline-none transition " +
  "bg-neutral-800 text-neutral-100 placeholder-neutral-500 border-neutral-700 " +
  "focus:ring-2 focus:ring-[#C7AE6A] focus:border-transparent";

const labelBase = "mb-1 block text-sm text-neutral-300";

const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className, ...props }, ref) => (
    <input ref={ref} {...props} className={`${inputBase} ${className ?? ""}`} />
  )
);
TextInput.displayName = "TextInput";

/* ---------------- Flag component ---------------- */
function Flag({ code }: { code: Country }) {
  return (
    <ReactCountryFlag
      countryCode={code}
      svg
      aria-label={code}
      title={code}
      className="w-6 h-4 rounded"
    />
  );
}

/* ---------------- Country/Prefix Modal (internal) ---------------- */
type CountryPrefixModalProps = {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  current: Country;
  onSelect: (c: Country) => void;
  title: string;
};

function CountryPrefixModal({
  open,
  onClose,
  countries,
  current,
  onSelect,
  title,
}: CountryPrefixModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const countryName = (code: Country) => {
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
      const name = countryName(c).toLowerCase();
      const dial = getCountryCallingCode(c);
      return (
        name.includes(q) ||
        c.toLowerCase().includes(q) ||
        dial.includes(q.replace(/^\+/, ""))
      );
    });
  }, [countries, query]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[110]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-1"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-1"
            >
              <DialogPanel className="relative w-full max-w-xl mx-4 sm:mx-6 rounded-3xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 max-h-[90vh] p-5 sm:p-6 overflow-hidden">
                {/* Close button pinned top-right */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>

                <h2 className="text-lg font-semibold text-neutral-100 pr-10">
                  {title}
                </h2>

                <div className="mt-4">
                  <input
                    className={inputBase}
                    placeholder="Search country or prefix"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {/* Scrollable list with hidden scrollbar */}
                <div className="mt-3 overflow-y-auto max-h-[60vh] rounded-2xl border border-neutral-800 cod-no-scrollbar">
                  <ul className="divide-y divide-neutral-800">
                    {filtered.map((c) => {
                      const dial = getCountryCallingCode(c);
                      const selected = c === current;
                      return (
                        <li key={c}>
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(c);
                              onClose();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-neutral-200 hover:bg-neutral-800"
                          >
                            <Flag code={c} />
                            <span className="flex-1 text-sm">{countryName(c)}</span>
                            <span className="text-xs font-medium opacity-80">
                              +{dial}
                            </span>
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

/* ---------------- Main Register modal (dark, same as Login) ---------------- */
type Props = { open: boolean; onClose: () => void };

export default function RegisterChefModal({ open, onClose }: Props) {
  const { t } = useTranslation("register");

  // Form state
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");

  // Phone
  const [country, setCountry] = useState<Country>("IT");
  const [prefix, setPrefix] = useState<string>("39"); // without "+"
  const [localNumber, setLocalNumber] = useState<string>("");

  // Email & password
  const [email, setEmail] = useState("");
  const [email2, setEmail2] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);

  // Lists & UI
  const [countries, setCountries] = useState<Country[]>([]);
  const [openPrefix, setOpenPrefix] = useState(false);

  // Submit feedback
  const [submitMsg, setSubmitMsg] = useState<string>("");
  const [submitKind, setSubmitKind] = useState<"success" | "error" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep Italy first in list
  useEffect(() => {
    const all = (getCountries() ?? []) as Country[];
    const pinned: Country[] = ["IT"];
    const rest = all.filter((c) => !pinned.includes(c));
    setCountries([...pinned, ...rest]);
  }, []);

  // Update calling code on country change
  useEffect(() => {
    try {
      const cc = getCountryCallingCode(country);
      setPrefix(String(cc));
    } catch {
      /* no-op */
    }
  }, [country]);

  // Normalized local phone number (digits only)
  const phoneNumber = useMemo<string>(
    () => localNumber.replace(/[^\d]/g, ""),
    [localNumber]
  );

  // Enable submit only when valid (client-side)
  const canSubmit = useMemo(
    () =>
      name.trim() &&
      surname.trim() &&
      phoneNumber &&
      email.trim() &&
      email2.trim() &&
      email === email2 &&
      PASSWORD_RE.test(password) && // strong password
      agree &&
      !isSubmitting,
    [name, surname, phoneNumber, email, email2, password, agree, isSubmitting]
  );

  // First friendly error for UX
  const firstError = (): string => {
    if (!name.trim()) return t("errors.required");
    if (!surname.trim()) return t("errors.required");
    if (!phoneNumber) return t("errors.phoneInvalid");
    const emailRe = /\S+@\S+\.\S+/;
    if (!emailRe.test(email)) return t("errors.emailInvalid");
    if (email !== email2) return t("errors.emailsDontMatch");
    if (!PASSWORD_RE.test(password)) {
      // preferă i18n dacă există cheia; altfel fallback clar
      const maybePolicy = t("errors.passwordPolicy");
      return maybePolicy && maybePolicy !== "errors.passwordPolicy"
        ? maybePolicy
        : PASSWORD_POLICY_FALLBACK;
    }
    if (!agree) return t("errors.termsRequired");
    return t("messages.errorBody");
  };

  // Reset form after success
  const resetForm = () => {
    setName("");
    setSurname("");
    setLocalNumber("");
    setEmail("");
    setEmail2("");
    setPassword("");
    setAgree(false);
    setCountry("IT");
    setPrefix("39");
  };

  // Submit registration
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMsg("");
    setSubmitKind("");

    if (!canSubmit) {
      setSubmitKind("error");
      setSubmitMsg(firstError());
      return;
    }

    try {
      setIsSubmitting(true);

      await axios.post(
        REG_ENDPOINT,
        {
          firstName: name.trim(),
          lastName: surname.trim(),
          countryCode: country,
          phonePrefix: prefix,
          phoneNumber: phoneNumber,
          email: email.trim(),
          password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setSubmitKind("success");
      setSubmitMsg(`${t("messages.successBody")} ${email}`);

      // Gentle close after a short delay so the message is visible
      window.setTimeout(() => {
        resetForm();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      let apiMsg = t("messages.errorBody");

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (isApiErrorData(data)) {
          if (status === 409 || data.code === "EMAIL_EXISTS") {
            apiMsg = t("errors.emailExists");
          } else {
            apiMsg = data.message ?? err.message ?? apiMsg;
          }
        } else {
          // Axios error without typed body (e.g., network)
          apiMsg = err.message ?? apiMsg;
        }
      } else if (err instanceof Error) {
        apiMsg = err.message || apiMsg;
      }

      setSubmitKind("error");
      setSubmitMsg(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={onClose}>
          {/* Dark overlay */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
          </TransitionChild>

          {/* Centered dark panel with hidden scrollbar */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95 translate-y-1"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-1"
              >
                <DialogPanel className="relative w-full max-w-lg sm:max-w-xl mx-4 sm:mx-6 rounded-3xl bg-neutral-900 shadow-2xl ring-1 ring-white/10 max-h-[90vh] overflow-y-auto cod-no-scrollbar p-5 sm:p-6">
                  {/* Close button pinned to top-right */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    aria-label={t("actions.close")}
                  >
                    <X size={16} />
                  </button>

                  {/* Header (centered) */}
                  <div className="text-center mb-4 sm:mb-6">
                    <DialogTitle as="div" className="sr-only">
                      {t("title")}
                    </DialogTitle>
                    <Heading
                      level="h3"
                      className="text-2xl font-semibold text-[#C7AE6A]"
                    >
                      {t("title")}
                    </Heading>
                    <Paragraph
                      align="center"
                      weight="medium"
                      color="auto"
                      size="base"
                      className="mt-2 text-neutral-300"
                    >
                      {t("subtitle")}
                    </Paragraph>
                  </div>

                  {/* Form */}
                  <form onSubmit={onSubmit} className="space-y-3">
                    <div>
                      <label htmlFor="name" className={labelBase}>
                        {t("fields.name.label")}
                      </label>
                      <TextInput
                        id="name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("fields.name.placeholder")}
                        required
                        minLength={2}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label htmlFor="surname" className={labelBase}>
                        {t("fields.surname.label")}
                      </label>
                      <TextInput
                        id="surname"
                        name="surname"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder={t("fields.surname.placeholder")}
                        required
                        minLength={2}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Phone group */}
                    <div>
                      <span className={labelBase}>{t("fields.phone.label")}</span>

                      <div className="flex items-center gap-2">
                        {/* Country picker trigger (dark) */}
                        <button
                          type="button"
                          onClick={() => setOpenPrefix(true)}
                          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-neutral-800 px-3 text-neutral-100 border border-neutral-700 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#C7AE6A]"
                          aria-label={t("actions.changeCountry")}
                          title={country}
                          disabled={isSubmitting}
                        >
                          <Flag code={country} />
                          <ChevronDown size={16} className="opacity-70" />
                        </button>

                        {/* Prefix (readonly) */}
                        <TextInput
                          aria-label={t("fields.phone.prefix")}
                          value={`+${prefix}`}
                          readOnly
                          className="min-w-[110px] cursor-pointer select-none"
                          onClick={() => !isSubmitting && setOpenPrefix(true)}
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Local number */}
                      <div className="mt-2">
                        <TextInput
                          aria-label={t("fields.phone.label")}
                          inputMode="numeric"
                          placeholder={t("fields.phone.numberPlaceholder")}
                          value={localNumber}
                          onChange={(e) => setLocalNumber(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className={labelBase}>
                        {t("fields.email.label")}
                      </label>
                      <TextInput
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("fields.email.placeholder")}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label htmlFor="email2" className={labelBase}>
                        {t("fields.emailConfirm.label")}
                      </label>
                      <TextInput
                        id="email2"
                        name="email2"
                        type="email"
                        value={email2}
                        onChange={(e) => setEmail2(e.target.value)}
                        placeholder={t("fields.emailConfirm.placeholder")}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className={labelBase}>
                        {t("fields.password.label")}
                      </label>
                      <div className="relative">
                        <TextInput
                          id="password"
                          name="password"
                          type={showPass ? "text" : "password"}
                          placeholder={t("fields.password.placeholder")}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                          required
                          minLength={8}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                          aria-label={
                            showPass ? t("actions.hidePassword") : t("actions.showPassword")
                          }
                          disabled={isSubmitting}
                        >
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {/* optional hint: ținut în componentă, nu depinde de i18n */}
                      <p className="mt-1 text-xs text-neutral-400">
                        8–72 chars, include uppercase, lowercase and a number, no spaces.
                      </p>
                    </div>

                    {/* Terms — gold bg + black check when selected */}
                    <label
                      htmlFor="reg-terms"
                      className="my-6 flex items-start gap-3 text-sm text-neutral-300 cursor-pointer"
                    >
                      {/* Accessible native input (visually hidden) */}
                      <input
                        id="reg-terms"
                        type="checkbox"
                        className="peer sr-only"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        required
                        disabled={isSubmitting}
                      />
                      {/* Custom box linked to peer state */}
                      <span className="relative mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border border-neutral-600 bg-neutral-800 transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#C7AE6A] peer-checked:bg-[#C7AE6A]">
                        <svg
                          viewBox="0 0 20 20"
                          className="pointer-events-none absolute h-3.5 w-3.5 opacity-0 transition-opacity peer-checked:opacity-100"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 10.5l3 3 7-7"
                            fill="none"
                            stroke="#000000"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>
                        {t("terms.prefix")}{" "}
                        <Link
                          href="/terms"
                          className="underline decoration-[#C7AE6A] underline-offset-2"
                        >
                          {t("terms.terms")}
                        </Link>{" "}
                        {t("terms.connector")}{" "}
                        <Link
                          href="/privacy"
                          className="underline decoration-[#C7AE6A] underline-offset-2"
                        >
                          {t("terms.privacy")}
                        </Link>
                        .
                      </span>
                    </label>

                    {/* Submit + feedback */}
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className={
                        "mt-2 h-11 w-full rounded-2xl font-semibold transition inline-flex items-center justify-center gap-2 " +
                        (canSubmit
                          ? "bg-[#C7AE6A] text-neutral-900 hover:brightness-95"
                          : "bg-neutral-800 text-neutral-500 cursor-not-allowed")
                      }
                    >
                      {isSubmitting ? t("actions.submitting") : t("actions.register")}
                    </button>

                    {submitKind && (
                      <p
                        className={
                          "mt-2 text-center text-sm " +
                          (submitKind === "success" ? "text-emerald-400" : "text-red-400")
                        }
                        role="status"
                        aria-live="polite"
                      >
                        {submitKind === "success"
                          ? `${t("messages.successTitle")}: ${t(
                              "messages.successBody"
                            )} ${email}. ${t("messages.successFollowUp")}`
                          : `${t("messages.errorTitle")}: ${submitMsg}`}
                      </p>
                    )}
                  </form>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Country/prefix modal (dark) */}
      <CountryPrefixModal
        open={openPrefix}
        onClose={() => setOpenPrefix(false)}
        countries={countries}
        current={country}
        onSelect={(c) => setCountry(c)}
        title={t("actions.changeCountry")}
      />

      {/* Local CSS to hide scrollbars (keeps scrolling) */}
      <style jsx global>{`
        .cod-no-scrollbar::-webkit-scrollbar { display: none; }
        .cod-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
