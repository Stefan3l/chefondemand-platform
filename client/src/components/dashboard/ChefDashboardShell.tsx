'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ClipboardList,
  MessageSquare,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';
import { useTranslation } from '@/utils/useTranslation';

// import components
import LogoDashboard from './LogoDashboard';
import StickyHeader from './StickyHeader';
import WelcomeBanner from './WelcomeBanner';
import DashboardSidebar from './DashboardSidebar';  

interface Props {
  children: React.ReactNode;
  userName?: string;
}

export default function ChefDashboardShell({ children, userName = 'Stefanel Mihaila' }: Props) {
  const { t, locale } = useTranslation('dashboard');
  const pathname = usePathname();

  const [mobileDrawer, setMobileDrawer] = React.useState(false);

  const base = `/${locale}`;
  const firstName = userName.split(' ')[0] || userName;

  // Replace with real data when available
  const richiesteDisponibili = 0;
  const unread = 0;

  const isActive = (href: string): boolean => Boolean(pathname?.startsWith(href));

  return (
    <div className="h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Desktop: fixed sidebar */}
      <div className="fixed inset-y-0 left-0 hidden md:block">
        <LogoDashboard />
        <DashboardSidebar  
          base={base}
          richiesteDisponibili={richiesteDisponibili}
          unread={unread}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileDrawer && (
        <>
          <div
            className="fixed inset-x-0 bottom-0 top-22 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileDrawer(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 md:hidden mt-22">
           
            <DashboardSidebar
              base={base}
              richiesteDisponibili={richiesteDisponibili}
              unread={unread}
            />
          </div>
        </>
      )}

      {/* Main column */}
      <div className="flex h-full flex-col md:pl-64">
        {/* Sticky header */}
        <StickyHeader base={base} firstName={firstName} t={t} />
      
        

        {/* Scrollable content */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 ">
          <WelcomeBanner firstName={firstName} />
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-white/10 bg-neutral-950 md:hidden">
          <Link href={`${base}/dashboard`} className={`flex flex-col items-center text-xs ${isActive(`${base}/dashboard`) ? 'text-[#C7AE6A]' : 'text-neutral-300'}`}>
            <Home size={18} />
            <span>{t('nav.home')}</span>
          </Link>
          <Link href={`${base}/requests`} className={`flex flex-col items-center text-xs ${isActive(`${base}/requests`) ? 'text-[#C7AE6A]' : 'text-neutral-300'}`}>
            <ClipboardList size={18} />
            <span>{t('nav.requests')}</span>
          </Link>
          <Link href={`${base}/messages`} className={`flex flex-col items-center text-xs ${isActive(`${base}/messages`) ? 'text-[#C7AE6A]' : 'text-neutral-300'}`}>
            <MessageSquare size={18} />
            <span>{t('nav.messages')}</span>
          </Link>
          <Link href={`${base}/calendar`} className={`flex flex-col items-center text-xs ${isActive(`${base}/calendar`) ? 'text-[#C7AE6A]' : 'text-neutral-300'}`}>
            <Calendar size={18} />
            <span>{t('nav.calendar')}</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawer(true)}
            className="flex flex-col items-center text-xs text-neutral-300"
          >
            <MoreHorizontal size={18} />
            <span>{t('nav.more')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
