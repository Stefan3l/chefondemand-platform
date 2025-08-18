'use client';

import ChefDashboardShell from '@/components/dashboard/ChefDashboardShell';
import Link from 'next/link';
import { CheckCircle2, Circle, ClipboardList, Inbox, Send, CheckCircle, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/utils/useTranslation';

const GOLD = '#C7AE6A';

type Step = { text: string; done: boolean };
type StatItem = { label: string; value: number; icon: LucideIcon; iconBg: string; iconColor: string };

export default function DashboardPage() {
  const { t, locale } = useTranslation('dashboard');
  const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';

  // mock data
  const profileComplete = 62;

  const steps: Step[] = [
    { text: t('profile.steps.photo'),   done: false },
    { text: t('profile.steps.menu'),    done: false },
    { text: t('profile.steps.certs'),   done: true  },
    { text: t('profile.steps.payments'), done: false }
  ];

  const stats: StatItem[] = [
    { label: t('stats.available'), value: 0, icon: ClipboardList, iconBg: 'rgba(88,101,242,0.10)', iconColor: '#5865F2' },
    { label: t('stats.received'),  value: 0, icon: Inbox,         iconBg: 'rgba(254,178,42,0.10)', iconColor: '#FEB22A' },
    { label: t('stats.sent'),      value: 0, icon: Send,          iconBg: 'rgba(235,69,158,0.10)', iconColor: '#EB459E' },
    { label: t('stats.closed'),    value: 0, icon: CheckCircle,   iconBg: 'rgba(34,197,94,0.10)',  iconColor: '#22C55E' },
  ];

  const monthLabel = new Date().toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });
  const monthOnly  = new Date().toLocaleDateString(dateLocale, { month: 'long' });

  return (
    <ChefDashboardShell userName="Stefanel Mihaila">
      {/* Profile completion */}
      {profileComplete < 100 && (
        <section className="rounded-2xl border border-white/10 bg-neutral-900 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-100">{t('profile.title')}</h3>
              <p className="text-sm text-neutral-400">{t('profile.subtitle')}</p>
            </div>

            {/* progress ring */}
            <div className="relative grid h-16 w-16 place-items-center">
              <svg viewBox="0 0 36 36" className="-rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke={GOLD} strokeWidth={3}
                  strokeDasharray={`${(profileComplete / 100) * 97} 97`} strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-semibold">{profileComplete}%</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {steps.map((s) => (
              <div
                key={s.text}
                className={[
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  s.done ? 'bg-emerald-400/5 text-emerald-400' : 'bg-white/5 text-neutral-300',
                ].join(' ')}
              >
                {s.done ? <CheckCircle2 size={16} /> : <Circle size={12} className="text-neutral-500" />}
                <span>{s.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link
              href={`/${locale}/profile`}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:brightness-95"
              style={{ backgroundColor: GOLD }}
            >
              {t('profile.button')} →
            </Link>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-300">{t('stats.title')}</h2>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300">
            {monthLabel}
            <span className="opacity-60">▼</span>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: s.iconBg, color: s.iconColor }}>
                  <s.icon size={18} />
                </div>
                <div>
                  <div className="text-xs text-neutral-400">{s.label}</div>
                  <div className="text-lg font-semibold">{s.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main grid */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Revenue */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">
              {t('revenue.title')} {monthOnly}
            </h3>
            <span style={{ color: GOLD }}>€0</span>
          </div>
          <div className="h-64 rounded-xl bg-white/5" />
        </div>

        {/* Bookings */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{t('bookings.title')}</h3>
            <Link href={`/${locale}/requests`} className="text-sm text-neutral-400 hover:text-neutral-200">
              {t('bookings.viewAll')}
            </Link>
          </div>

          <div className="grid place-items-center rounded-xl bg-white/5 p-8 text-center text-neutral-400">
            <span className="text-3xl">📅</span>
            <p className="mt-2 text-sm">{t('bookings.emptyTitle')}</p>
            <span className="text-xs opacity-70">{t('bookings.emptySubtitle')}</span>
          </div>
        </div>
      </section>
    </ChefDashboardShell>
  );
}
