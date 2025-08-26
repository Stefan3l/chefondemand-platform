'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/utils/useTranslation';
import { Button } from '@/components/ui';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import { useMe } from '@/context/me';

interface StickyHeaderProps {
  base: string;
  firstName?: string; 
}

export default function StickyHeader({ base, firstName: firstNameProp }: StickyHeaderProps) {
  const { t } = useTranslation('dashboard');
  const { t: tLogout } = useTranslation('logoutModal');
  const pathname = usePathname();
  const router = useRouter();

  const me = useMe();
  const firstName = me?.firstName ?? firstNameProp ?? '';

  const [userOpen, setUserOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    if (userOpen) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [userOpen]);

  const currentRouteName = (() => {
    const lastSegment = pathname.split('/').pop() || '';
    if (lastSegment === 'dashboard') return '';
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  })();

  // Logout: ideal ar fi să lovești și /auth/logout ca să se șteargă cookie-ul httpOnly.
  const handleLogout = async () => {
    try { await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/auth/logout`, { credentials: 'include' }); } catch {}
    localStorage.removeItem('loggedUser');
    router.push('/login');
  };

  const openChangePassword = () => {
    setUserOpen(false);
    setChangePwdOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-22
        before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-transparent before:via-[#C7AE6A] before:to-transparent
        after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-gradient-to-r after:from-transparent after:via-[#C7AE6A] after:to-transparent
        bg-gradient-to-br from-neutral-900/90 to-neutral-800/80">
        <div className="flex items-center justify-between lg:justify-end px-4 lg:px-6 py-6">
          <Image src="/logo.webp" alt="Logo" width={180} height={30} className="lg:hidden" />
          {currentRouteName && (
            <div className="hidden lg:block text-[#C7AE6A] mr-auto lg:ml-6 text-sm lg:text-xl lg:font-semibold">
              {currentRouteName}
            </div>
          )}

          <div className="flex gap-4 items-center" ref={dropdownRef}>
            <div className="relative hidden lg:flex items-center">
              <input
                placeholder={t('header.searchPlaceholder')}
                className="h-10 w-64 rounded-full border border-white/10 bg-[#1D1D1D] px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:ring-2 focus:ring-[#C7AE6A]"
              />
              <Search size={16} className="absolute right-3 text-neutral-500" />
            </div>

            <button
              type="button"
              onClick={() => setUserOpen(!userOpen)}
              className="inline-flex items-center gap-2 cursor-pointer rounded-full border border-white/10 bg-[#2D291F] px-6 lg:px-4 py-2 hover:border-[#C7AE6A] hover:-translate-y-[1px] transition duration-300">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-[#C7AE6A] text-black font-semibold">
                {(firstName?.charAt(0).toUpperCase() || (me ? me.lastName?.charAt(0).toUpperCase() : '?'))}
              </div>
              <span className="hidden sm:inline text-sm">{firstName || '...'}</span>
              <ChevronDown size={16} className="text-[#C7AE6A]" />
            </button>

            {userOpen && (
              <div className="absolute right-4 lg:right-6 mt-56 w-48 rounded-xl border border-white/10 bg-neutral-900 px-2 py-4 z-50 hover:border-[#C7AE6A33]">
                <Link href={`${base}/account`} className="block rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-white/5">
                  {t('nav.account')}
                </Link>
                <button type="button" onClick={openChangePassword} className="w-full text-left rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-white/5">
                  {t('nav.changePassword')}
                </button>
                <button onClick={() => setConfirmOpen(true)} className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-400 hover:bg:white/5">
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-xl bg-neutral-900 border border-white/10 hover:border-[#C7AE6A33] px-4 lg:px-8 py-10 text-center space-y-6">
            <p className="text-md lg:text-xl text-center text-neutral-200">{tLogout('confirm_title')}</p>
            <div className="flex justify-between gap-4 lg:gap-10 mt-10">
              <Button onClick={handleLogout} className="text-md">{tLogout('yes')}</Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)} className="text-md">{tLogout('no')}</Button>
            </div>
          </div>
        </div>
      )}

      <ChangePasswordModal open={changePwdOpen} onClose={() => setChangePwdOpen(false)} />
    </>
  );
}
