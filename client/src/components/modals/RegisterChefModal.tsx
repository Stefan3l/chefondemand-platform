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
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react';
import { X, Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';
import ReactCountryFlag from 'react-country-flag';
import { Heading, Paragraph } from '@/components/ui';
import { useTranslation } from '@/utils/useTranslation';

type Props = { open: boolean; onClose: () => void };

/* Stiluri input */
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

/* Steag SVG (dimensiuni consistente) */
function Flag({ code }: { code: Country }) {
  return (
    <ReactCountryFlag
      countryCode={code}
      svg
      aria-label={code}
      title={code}
      style={{ width: '24px', height: '18px', borderRadius: '3px' }}
    />
  );
}

export default function RegisterChefModal({ open, onClose }: Props) {
  const { t } = useTranslation('register');

  // Form state
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');

  // Phone
  const [country, setCountry] = useState<Country>('IT'); // default IT
  const [prefix, setPrefix] = useState<string>('39'); // +39
  const [localNumber, setLocalNumber] = useState<string>('');

  const [email, setEmail] = useState('');
  const [email2, setEmail2] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);

  // Feedback sub buton
  const [submitMsg, setSubmitMsg] = useState<string>('');
  const [submitKind, setSubmitKind] = useState<'success' | 'error' | ''>('');

  /* Populate listă țări (IT prima) */
  useEffect(() => {
    const all = (getCountries() ?? []) as Country[];
    const pinned: Country[] = ['IT'];
    const rest = all.filter((c) => !pinned.includes(c));
    setCountries([...pinned, ...rest]);
  }, []);

  /* Schimbă automat prefixul la schimbarea țării */
  useEffect(() => {
    try {
      const cc = getCountryCallingCode(country);
      setPrefix(String(cc));
    } catch {
      /* no-op */
    }
  }, [country]);

  /* Construcție număr complet */
  const fullPhone = useMemo(() => {
    const digits = localNumber.replace(/[^\d]/g, '');
    return digits ? `+${prefix}${digits}` : undefined;
  }, [prefix, localNumber]);

  const canSubmit = useMemo(
    () =>
      name.trim() &&
      surname.trim() &&
      !!fullPhone &&
      email.trim() &&
      email2.trim() &&
      email === email2 &&
      password.length >= 6 &&
      agree,
    [name, surname, fullPhone, email, email2, password, agree]
  );

  /* Primul mesaj de eroare logic (pentru UX) */
  const firstError = (): string => {
    if (!name.trim()) return t('errors.required');
    if (!surname.trim()) return t('errors.required');
    if (!fullPhone) return t('errors.phoneInvalid');

    // email pattern minimal
    const emailRe = /\S+@\S+\.\S+/;
    if (!emailRe.test(email)) return t('errors.emailInvalid');
    if (email !== email2) return t('errors.emailsDontMatch');
    if (password.length < 6) return t('errors.passwordTooShort');
    if (!agree) return t('errors.termsRequired');
    return t('messages.errorBody');
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
     
      setSubmitKind('success');
   
      setSubmitMsg(`${t('messages.successBody')} ${email}`);

     
    } catch {
      setSubmitKind('error');
      setSubmitMsg(t('messages.errorBody'));
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
      {/* Overlay + container cu centrare verticală */}
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" />
        </TransitionChild>

        {/* Centrat pe toate ecranele; pe mobile panelul nu depășește view-ul */}
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
              <DialogPanel
                /* lățime fluidă + max-height cu scroll intern:
                   mereu vizibil în view, centrat pe ecrane mari */
                className="w-full max-w-lg sm:max-w-xl rounded-3xl border border-zinc-200/60 bg-white shadow-xl
                           dark:border-zinc-800 dark:bg-zinc-950
                           max-h-[90vh] overflow-y-auto no-scrollbar p-4 sm:p-6"
              >
                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  aria-label={t('actions.close')}
                >
                  <X size={16} />
                </button>

                {/* Header */}
                <div className="text-center -mt-2 mb-4 sm:mb-6">
                  <DialogTitle className="text-2xl font-semibold text-[#C7AE6A]">
                    <Heading level="h2">{t('title')}</Heading>
                  </DialogTitle>
                  <Paragraph
                    align="center"
                    weight="medium"
                    color="auto"
                    size="base"
                    className="mt-2"
                  >
                    {t('subtitle')}
                  </Paragraph>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="name" className={labelBase}>
                      {t('fields.name.label')}
                    </label>
                    <TextInput
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('fields.name.placeholder')}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="surname" className={labelBase}>
                      {t('fields.surname.label')}
                    </label>
                    <TextInput
                      id="surname"
                      name="surname"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder={t('fields.surname.placeholder')}
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelBase}>{t('fields.phone.label')}</label>

                    <div className="flex items-center gap-2">
                      {/* Flag + dropdown */}
                      <div className="relative">
                        <Listbox value={country} onChange={setCountry}>
                          <ListboxButton
                            data-flag-button
                            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-3
                                       text-black hover:text-gray-600
                                       focus:outline-none focus:ring-2 focus:ring-[#C7AE6A]
                                       dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-300"
                            aria-label={t('actions.changeCountry')}
                            title={countryName(country)}
                          >
                            <Flag code={country} />
                            <ChevronDown size={16} className="opacity-70" />
                          </ListboxButton>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                          >
                            <ListboxOptions className="absolute left-0 z-[101] mt-2 max-h-80 overflow-auto no-scrollbar w-[min(380px,92vw)] rounded-2xl border border-zinc-200 bg-white p-1 shadow-lg focus:outline-none dark:border-zinc-800 dark:bg-zinc-900">
                              {countries.map((c) => {
                                const dial = getCountryCallingCode(c);
                                return (
                                  <ListboxOption
                                    key={c}
                                    value={c}
                                    className="group flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer
                                               text-black hover:text-gray-600 hover:bg-zinc-100
                                               dark:text-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800"
                                  >
                                    {({ selected }) => (
                                      <>
                                        <Flag code={c} />
                                        <span className="flex-1 text-sm">
                                          {countryName(c)}
                                        </span>
                                        <span className="text-xs font-medium opacity-80">
                                          +{dial}
                                        </span>
                                        {selected && (
                                          <Check size={16} className="ml-1 opacity-80" />
                                        )}
                                      </>
                                    )}
                                  </ListboxOption>
                                );
                              })}
                            </ListboxOptions>
                          </Transition>
                        </Listbox>
                      </div>

                      {/* Prefix (read-only) */}
                      <TextInput
                        aria-label={t('fields.phone.prefix')}
                        value={`+${prefix}`}
                        readOnly
                        className="min-w-[110px] cursor-default select-none"
                        onClick={(e) => {
                          const btn = e.currentTarget
                            .parentElement?.querySelector(
                              'button[data-flag-button]'
                            ) as HTMLButtonElement | null;
                          btn?.focus();
                          btn?.click();
                        }}
                      />
                    </div>

                    {/* Number */}
                    <div className="mt-2">
                      <TextInput
                        aria-label={t('fields.phone.label')}
                        inputMode="numeric"
                        placeholder={t('fields.phone.numberPlaceholder')}
                        value={localNumber}
                        onChange={(e) => setLocalNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className={labelBase}>
                      {t('fields.email.label')}
                    </label>
                    <TextInput
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('fields.email.placeholder')}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email2" className={labelBase}>
                      {t('fields.emailConfirm.label')}
                    </label>
                    <TextInput
                      id="email2"
                      name="email2"
                      type="email"
                      value={email2}
                      onChange={(e) => setEmail2(e.target.value)}
                      placeholder={t('fields.emailConfirm.placeholder')}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className={labelBase}>
                      {t('fields.password.label')}
                    </label>
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
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        aria-label={showPass ? t('actions.hidePassword') : t('actions.showPassword')}
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
                    />
                    <span>
                      {t('terms.prefix')}{' '}
                      <Link
                        href="/terms"
                        className="underline decoration-[#C7AE6A] underline-offset-2"
                      >
                        {t('terms.terms')}
                      </Link>{' '}
                      {t('terms.connector')}{' '}
                      <Link
                        href="/privacy"
                        className="underline decoration-[#C7AE6A] underline-offset-2"
                      >
                        {t('terms.privacy')}
                      </Link>
                      .
                    </span>
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={
                      'mt-2 h-11 w-full rounded-2xl font-semibold transition ' +
                      (canSubmit
                        ? 'bg-[#C7AE6A] text-black hover:brightness-95'
                        : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 cursor-not-allowed')
                    }
                  >
                    {t('actions.register')}
                  </button>

                  {/* Mesaj sub buton */}
                  {submitKind && (
                    <p
                      className={
                        'mt-2 text-center text-sm ' +
                        (submitKind === 'success' ? 'text-emerald-500' : 'text-red-500')
                      }
                    >
                      {submitKind === 'success'
                        ? `${t('messages.successTitle')}: ${submitMsg}`
                        : `${t('messages.errorTitle')}: ${submitMsg}`}
                    </p>
                  )}
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
