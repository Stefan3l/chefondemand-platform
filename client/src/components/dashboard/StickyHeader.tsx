'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';

interface StickyHeaderProps {
  base: string;
  firstName: string;
  t: (key: string) => string;
}

export default function StickyHeader({ base, firstName, t }: StickyHeaderProps) {
  const [userOpen, setUserOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // inchiere dropdown la click în afară
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    if (userOpen) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [userOpen]);

  // Name of current page ("/dashboard" -> "")
  const currentRouteName = (() => {
    const lastSegment = pathname.split('/').pop() || '';
    if (lastSegment === `dashboard`) 
      return "";
    // capitalize first letter
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  })();

  return (
    <header className="sticky top-0 z-30 h-22
        before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-transparent before:via-[#C7AE6A] before:to-transparent
        after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-gradient-to-r after:from-transparent after:via-[#C7AE6A] after:to-transparent
        bg-gradient-to-br from-neutral-900/90 to-neutral-800/80
      ">
      <div className="flex items-center justify-between lg:justify-end px-4 lg:px-6 py-6">
        {/* Logo (mobile) */}
        <Image src="/logo.webp" alt="Logo" width={180} height={30} className="lg:hidden"/>

        {/* Name of current page (desktop only) */}
        {currentRouteName && (
          <div className="hidden lg:block text-[#C7AE6A] mr-auto lg:ml-6 text-sm lg:text-xl lg:font-semibold">
            {currentRouteName}
          </div>
        )}

        {/* Search + user */}
        <div className="flex gap-4 items-center" ref={dropdownRef}>
          {/* Search */}
          <div className="relative hidden lg:flex items-center">
            <input
              placeholder={t('header.searchPlaceholder')}
              className="h-10 w-64 rounded-full border border-white/10 bg-[#1D1D1D] px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:ring-2 focus:ring-[#C7AE6A]"
            />
            <Search size={16} className="absolute right-3 text-neutral-500"/>
          </div>

          {/* User button */}
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            className="inline-flex items-center gap-2 cursor-pointer rounded-full border border-white/10 bg-[#2D291F] px-6 lg:px-4 py-2 hover:border-[#C7AE6A] hover:-translate-y-[1px] transition duration-300"
          >
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#C7AE6A] text-black font-semibold">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-sm">{firstName}</span>
            <ChevronDown size={16} className="text-[#C7AE6A]"/>
          </button>

          {/* Dropdown */}
          {userOpen && (
            <div className="absolute right-4 lg:right-6 mt-54 w-48 rounded-xl border border-white/10 bg-neutral-900 px-2 py-4 z-50 hover:border-[#C7AE6A33]">
              <Link href={`${base}/account`} className="block rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-white/5">
                Il mio account
              </Link>
              <Link href={`${base}/change-password`} className="block rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-white/5">
                Cambio password
              </Link>
              <Link href={`${base}/logout`} className="block rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-white/5">
                {t('nav.logout')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
