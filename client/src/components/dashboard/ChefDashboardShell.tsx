'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Mail,
  Calendar,
  User,
  UtensilsCrossed,
  ChevronDown,
  LogOut,
  X,
  BookOpen,
  Pizza,
  Home,
  MessageSquare,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from '@/utils/useTranslation';




//import components
import LogoDashboard from './LogoDashboard';
import StickyHeader from './StickyHeader';
import WelcomeBanner from './WelcomeBanner';

const GOLD = '#C7AE6A';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface Props {
  children: React.ReactNode;
  userName?: string;
}

export default function ChefDashboardShell({ children, userName = 'Stefanel Mihaila' }: Props) {
  const { t, locale } = useTranslation('dashboard');
  const pathname = usePathname();

  const [mobileDrawer, setMobileDrawer] = React.useState<boolean>(false);
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

  const base = `/${locale}`;
  const firstName = userName.split(' ')[0] || userName;

   

  // Replace with real data when available
  const richiesteDisponibili = 0;
  const unread = 0;

  const isActive = (href: string): boolean => Boolean(pathname?.startsWith(href));

  const navTop: NavItem[] = React.useMemo(
    () => [
      { href: `${base}/dashboard`, label: t('nav.dashboard'), icon: LayoutDashboard },
      { href: `${base}/requests`, label: t('nav.requests'), icon: ClipboardList, badge: richiesteDisponibili },
      { href: `${base}/messages`, label: t('nav.messages'), icon: Mail, badge: unread },
      { href: `${base}/calendar`, label: t('nav.calendar'), icon: Calendar },
      { href: `${base}/profile`, label: t('nav.profile'), icon: User },
    ],
    [base, richiesteDisponibili, t, unread]
  );

  const navBottom: NavItem[] = React.useMemo(
    () => [
      { href: `${base}/settings`, label: t('nav.settings'), icon: User },
      { href: `${base}/help`, label: t('nav.help'), icon: Mail },
    ],
    [base, t]
  );

  const Sidebar: React.ReactElement = (
    <aside
      className="h-full w-64 overflow-y-auto border-r border-[rgba(199,174,106,0.15)]
                 bg-gradient-to-b from-neutral-900/95 to-neutral-900 shadow-[4px_0_30px_rgba(0,0,0,0.5)] backdrop-blur"
      role="navigation"
      aria-label="Sidebar"
    >
      {/* Logo header */}
      <LogoDashboard />


      {/* Nav list */}
      <nav className="px-2 py-3">
        <ul className="space-y-1">
          {navTop.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href);
            return (
              <li key={href} className="relative">
                <Link
                  href={href}
                  className={[
                    'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition border',
                    active
                      ? 'bg-[rgba(199,174,106,0.15)] text-[#C7AE6A] border-[rgba(199,174,106,0.30)] shadow-[0_0_20px_rgba(199,174,106,0.08)]'
                      : 'text-neutral-300 hover:text-neutral-100 hover:bg-white/5 border-transparent',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute left-0 top-0 h-full w-[3px] rounded-r',
                      active ? 'bg-[#C7AE6A]' : 'bg-[#C7AE6A] scale-y-0 group-hover:scale-y-100 origin-top transition-transform',
                    ].join(' ')}
                  />
                  <Icon size={18} className={active ? 'text-[#C7AE6A]' : ''} />
                  <span>{label}</span>

                  {typeof badge === 'number' && badge > 0 && (
                    <span
                      className="absolute right-5 top-1/2 -translate-y-1/2 rounded-2xl px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: GOLD, color: '#0A0A0A' }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          {/* Divider */}
          <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[rgba(199,174,106,0.2)] to-transparent" />

          {/* Dropdown: menus & dishes */}
          <li className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((s) => !s)}
              className="group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] text-neutral-300 transition hover:bg-white/5 hover:text-neutral-100"
            >
              <span className="flex items-center gap-3">
                <UtensilsCrossed size={18} />
                {t('nav.menus')}
              </span>
              <ChevronDown
                size={16}
                className={'text-[#C7AE6A] transition-transform ' + (menuOpen ? 'rotate-180' : '')}
              />
            </button>

            <div
              className={[
                'ml-10 mt-2 overflow-hidden rounded-lg transition-[max-height]',
                menuOpen ? 'max-h-44' : 'max-h-0',
              ].join(' ')}
            >
              <Link
                href={`${base}/menu`}
                className="mb-2 block rounded-md border-l-4 border-transparent bg-black/20 px-3 py-2 text-sm text-neutral-300 transition hover:translate-x-1 hover:border-[#C7AE6A] hover:bg-[rgba(199,174,106,0.10)]"
              >
                <span className="inline-flex items-center gap-2">
                  <BookOpen size={16} /> {t('nav.menu')}
                </span>
              </Link>
              <Link
                href={`${base}/dishes`}
                className="block rounded-md border-l-4 border-transparent bg-black/20 px-3 py-2 text-sm text-neutral-300 transition hover:translate-x-1 hover:border-[#C7AE6A] hover:bg-[rgba(199,174,106,0.10)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Pizza size={16} /> {t('nav.dishes')}
                </span>
              </Link>
            </div>
          </li>

          {/* Divider */}
          <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[rgba(199,174,106,0.2)] to-transparent" />

          {navBottom.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] transition border',
                    active
                      ? 'bg-[rgba(199,174,106,0.15)] text-[#C7AE6A] border-[rgba(199,174,106,0.30)]'
                      : 'text-neutral-300 hover:text-neutral-100 hover:bg-white/5 border-transparent',
                  ].join(' ')}
                >
                  <Icon size={18} className={active ? 'text-[#C7AE6A]' : ''} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}

          {/* Logout */}
          <li className="px-2 pt-2">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-neutral-200 transition hover:bg-white/10"
            >
              <LogOut size={16} />
              {t('nav.logout')}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );

  return (
    <div className="h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Desktop: fixed sidebar */}
      <div className="fixed inset-y-0 left-0 hidden md:block">{Sidebar}</div>
      {/* Mobile Drawer */}
      {mobileDrawer && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileDrawer(false)}
            role="button"
            aria-label="Close overlay"
            tabIndex={-1}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 md:hidden">{Sidebar}</div>
          <button
            type="button"
            onClick={() => setMobileDrawer(false)}
            className="fixed right-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </>
      )}

      {/* Main column */}
      <div className="flex h-full flex-col md:pl-64">
        {/* Sticky header */}
        <StickyHeader base={base} firstName={firstName} t={t} />

        <WelcomeBanner firstName={firstName} />

        {/* Scrollable content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-white/10 bg-neutral-950 md:hidden">
          <Link
            href={`${base}/dashboard`}
            className={`flex flex-col items-center text-xs ${
              isActive(`${base}/dashboard`) ? 'text-[#C7AE6A]' : 'text-neutral-300'
            }`}
          >
            <Home size={18} />
            <span>{t('nav.home')}</span>
          </Link>
          <Link
            href={`${base}/requests`}
            className={`flex flex-col items-center text-xs ${
              isActive(`${base}/requests`) ? 'text-[#C7AE6A]' : 'text-neutral-300'
            }`}
          >
            <ClipboardList size={18} />
            <span>{t('nav.requests')}</span>
          </Link>
          <Link
            href={`${base}/messages`}
            className={`flex flex-col items-center text-xs ${
              isActive(`${base}/messages`) ? 'text-[#C7AE6A]' : 'text-neutral-300'
            }`}
          >
            <MessageSquare size={18} />
            <span>{t('nav.messages')}</span>
          </Link>
          <Link
            href={`${base}/calendar`}
            className={`flex flex-col items-center text-xs ${
              isActive(`${base}/calendar`) ? 'text-[#C7AE6A]' : 'text-neutral-300'
            }`}
          >
            <Calendar size={18} />
            <span>{t('nav.calendar')}</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawer(true)}
            className="flex flex-col items-center text-xs text-neutral-300"
            aria-label="More"
          >
            <MoreHorizontal size={18} />
            <span>{t('nav.more')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
