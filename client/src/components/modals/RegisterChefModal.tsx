'use client';

import {
  Fragment,
  useMemo,
  useState,
  useEffect,
  forwardRef,
  type ComponentPropsWithoutRef,
} from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { X, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';
import ReactCountryFlag from 'react-country-flag';
import { Heading, Paragraph } from '@/components/ui';
import { useTranslation } from '@/utils/useTranslation';

/* ---------- Config API ---------- */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:4000';
const REG_ENDPOINT = `${API_BASE}/api/registration`;

/* ---------- Input helpers ---------- */
const inputBase =
  'w-full h-11 rounded-2xl border px-4 text-sm outline-none transition ' +
  'bg-white text-black placeholder-zinc-400 border-zinc-300 ' +
  'focus:ring-2 focus:ring-[#C7AE6A] focus:border-transparent ' +
  'dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500 dark:border-zinc-700';

const labelBase = 'text-xs font-medium text-zinc-600 dark:text-zinc-300';

const TextInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} {...props} className={`${inputBase} ${className ?? ''}`} />
  )
);
TextInput.displayName = 'TextInput';

/* Steag (doar Tailwind) */
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

/* ---------- Modal centrat pentru alegerea țării/prefix ---------- */
type CountryPrefixModalProps = {
  open: boolean;
  onClose: () => void;
  countries: Country[];
  current: Country;
  onSelect: (c: Country) => void;
};

function CountryPrefixModal({
  open,
  onClose,
  countries,
  current,
  onSelect,
}: CountryPrefixModalProps) {
  const { t } = useTranslation('register');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const countryName = (code: Country) => {
    try {
      const dn = new Intl.DisplayNames(['en'], { type: 'region' });
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
        dial.includes(q.replace(/^\+/, ''))
      );
    });
  }, [countries, query]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[110]" onClose={onClose}>
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-1" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-1">
              <DialogPanel className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 max-h-[90vh] p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <DialogTitle as="div" className="sr-only">
                    {t('actions.changeCountry')}
                  </DialogTitle>
                  <h2 className="text-lg font-semibold">{t('actions.changeCountry')}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    aria-label={t('actions.close')}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4">
                  <TextInput
                    placeholder="Search country or prefix"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="mt-3 overflow-y-auto max-h-[60vh] rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
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
                            className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900"
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

/* ---------- Modalul principal ---------- */
type Props = { open: boolean; onClose: () => void };

export default function RegisterChefModal({ open, onClose }: Props) {
  const { t } = useTranslation('register');

  // Form state
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');

  // Phone
  const [country, setCountry] = useState<Country>('IT');
  const [prefix, setPrefix] = useState<string>('39'); // fără "+"
  const [localNumber, setLocalNumber] = useState<string>('');

  // Email & pass
  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);

  // State
  const [countries, setCountries] = useState<Country[]>([]);
  const [openPrefix, setOpenPrefix] = useState(false);

  // Submit UI
  const [submitMsg, setSubmitMsg] = useState<string>('');
  const [submitKind, setSubmitKind] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* IT prima în listă */
  useEffect(() => {
    const all = (getCountries() ?? []) as Country[];
    const pinned: Country[] = ['IT'];
    const rest = all.filter((c) => !pinned.includes(c));
    setCountries([...pinned, ...rest]);
  }, []);

  /* actualizează prefixul la schimbarea țării */
  useEffect(() => {
    try {
      const cc = getCountryCallingCode(country);
      setPrefix(String(cc));
    } catch {
      /* no-op */
    }
  }, [country]);

  const phoneNumber = useMemo<string>(() => localNumber.replace(/[^\d]/g, ''), [localNumber]);

  const canSubmit = useMemo(
    () =>
      name.trim() &&
      surname.trim() &&
      phoneNumber &&
      email.trim() &&
      email2.trim() &&
      email === email2 &&
      password.length >= 6 &&
      agree &&
      !isSubmitting,
    [name, surname, phoneNumber, email, email2, password, agree, isSubmitting]
  );

  const firstError = (): string => {
    if (!name.trim()) return t('errors.required');
    if (!surname.trim()) return t('errors.required');
    if (!phoneNumber) return t('errors.phoneInvalid');
    const emailRe = /\S+@\S+\.\S+/;
    if (!emailRe.test(email)) return t('errors.emailInvalid');
    if (email !== email2) return t('errors.emailsDontMatch');
    if (password.length < 6) return t('errors.passwordTooShort');
    if (!agree) return t('errors.termsRequired');
    return t('messages.errorBody');
  };

  const resetForm = () => {
    setName('');
    setSurname('');
    setLocalNumber('');
    setEmail('');
    setEmail2('');
    setPassword('');
    setAgree(false);
    setCountry('IT');
    setPrefix('39');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMsg('');
    setSubmitKind('');

    if (!canSubmit) {
      setSubmitKind('error');
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
          password
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setSubmitKind('success');
      setSubmitMsg(`${t('messages.successBody')} ${email}`);

      // reset + închide după 1.2s (lăsăm mesajul să se vadă puțin)
      window.setTimeout(() => {
        resetForm();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      let apiMsg = t('messages.errorBody');

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as { code?: string; message?: string } | undefined;

        if (status === 409 || data?.code === 'EMAIL_EXISTS') {
          apiMsg = t('errors.emailExists');
        } else {
          apiMsg = data?.message ?? err.message ?? apiMsg;
        }
      } else if (err instanceof Error) {
        apiMsg = err.message || apiMsg;
      }

      setSubmitKind('error');
      setSubmitMsg(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const countryName = (code: Country) => {
    try {
      const dn = new Intl.DisplayNames(['en'], { type: 'region' });
      return (dn.of(code) ?? code) as string;
    } catch {
      return code;
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" />
        </TransitionChild>

        {/* mereu centrat; panelul nu depășește view-ul */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <TransitionChild as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-1" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-1">
              <DialogPanel className="w-full max-w-lg sm:max-w-xl rounded-3xl border border-zinc-200/60 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  aria-label={t('actions.close')}
                >
                  <X size={16} />
                </button>

                {/* Header (fără nested <h2>) */}
                <div className="text-center -mt-2 mb-4 sm:mb-6">
                  <DialogTitle as="div" className="sr-only">
                    {t('title')}
                  </DialogTitle>
                  <Heading level="h2" className="text-2xl font-semibold text-[#C7AE6A]">
                    {t('title')}
                  </Heading>
                  <Paragraph align="center" weight="medium" color="auto" size="base" className="mt-2">
                    {t('subtitle')}
                  </Paragraph>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="name" className={labelBase}>{t('fields.name.label')}</label>
                    <TextInput id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('fields.name.placeholder')} required disabled={isSubmitting} />
                  </div>

                  <div>
                    <label htmlFor="surname" className={labelBase}>{t('fields.surname.label')}</label>
                    <TextInput id="surname" name="surname" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder={t('fields.surname.placeholder')} required disabled={isSubmitting} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelBase}>{t('fields.phone.label')}</label>

                    <div className="flex items-center gap-2">
                      {/* buton deschidere modal prefix */}
                      <button
                        type="button"
                        onClick={() => setOpenPrefix(true)}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-3 text-black hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C7AE6A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-300"
                        aria-label={t('actions.changeCountry')}
                        title={countryName(country)}
                        disabled={isSubmitting}
                      >
                        <Flag code={country} />
                        <ChevronDown size={16} className="opacity-70" />
                      </button>

                      {/* prefix (readonly) */}
                      <TextInput
                        aria-label={t('fields.phone.prefix')}
                        value={`+${prefix}`}
                        readOnly
                        className="min-w-[110px] cursor-pointer select-none"
                        onClick={() => !isSubmitting && setOpenPrefix(true)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* number */}
                    <div className="mt-2">
                      <TextInput
                        aria-label={t('fields.phone.label')}
                        inputMode="numeric"
                        placeholder={t('fields.phone.numberPlaceholder')}
                        value={localNumber}
                        onChange={(e) => setLocalNumber(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className={labelBase}>{t('fields.email.label')}</label>
                    <TextInput id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('fields.email.placeholder')} required disabled={isSubmitting} />
                  </div>

                  <div>
                    <label htmlFor="email2" className={labelBase}>{t('fields.emailConfirm.label')}</label>
                    <TextInput id="email2" name="email2" type="email" value={email2} onChange={(e) => setEmail2(e.target.value)} placeholder={t('fields.emailConfirm.placeholder')} required disabled={isSubmitting} />
                  </div>

                  <div>
                    <label htmlFor="password" className={labelBase}>{t('fields.password.label')}</label>
                    <div className="relative">
                      <TextInput
                        id="password"
                        name="password"
                        type={showPass ? 'text' : 'password'}
                        placeholder={t('fields.password.placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                        minLength={6}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        aria-label={showPass ? t('actions.hidePassword') : t('actions.showPassword')}
                        disabled={isSubmitting}
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="my-6 flex items-start gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#C7AE6A] focus:ring-[#C7AE6A] dark:border-zinc-700"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      required
                      disabled={isSubmitting}
                    />
                    <span>
                      {t('terms.prefix')}{' '}
                      <Link href="/terms" className="underline decoration-[#C7AE6A] underline-offset-2">{t('terms.terms')}</Link>{' '}
                      {t('terms.connector')}{' '}
                      <Link href="/privacy" className="underline decoration-[#C7AE6A] underline-offset-2">{t('terms.privacy')}</Link>.
                    </span>
                  </label>

                  {/* Submit cu spinner */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={
                      'mt-2 h-11 w-full rounded-2xl font-semibold transition inline-flex items-center justify-center gap-2 ' +
                      (canSubmit
                        ? 'bg-[#C7AE6A] text-black hover:brightness-95'
                        : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 cursor-not-allowed')
                    }
                  >
                    {isSubmitting && (
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"/>
                      </svg>
                    )}
                    <span>{isSubmitting ? t('actions.submitting') : t('actions.register')}</span>
                  </button>

                  {/* Feedback sub buton (aria-live) */}
                  {submitKind && (
                    <p
                      className={
                        'mt-2 text-center text-sm ' +
                        (submitKind === 'success' ? 'text-emerald-500' : 'text-red-500')
                      }
                      role="status"
                      aria-live="polite"
                    >
                      {submitKind === 'success'
                        ? `${t('messages.successTitle')}: ${t('messages.successBody')} ${email}. ${t('messages.successFollowUp')}`
                        : `${t('messages.errorTitle')}: ${submitMsg}`}
                    </p>
                  )}
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>

      {/* Modal prefix – centrat, adaptiv */}
      <CountryPrefixModal
        open={openPrefix}
        onClose={() => setOpenPrefix(false)}
        countries={countries}
        current={country}
        onSelect={(c) => setCountry(c)}
      />
    </Transition>
  );
}
