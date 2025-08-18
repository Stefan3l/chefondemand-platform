'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface StickyHeaderProps {
  base: string;
  firstName: string;
  t: (key: string) => string;
}

export default function StickyHeader({ base, firstName, t }: StickyHeaderProps) {
  const [userOpen, setUserOpen] = useState(false);

  return (
      <header
  className="sticky top-0 z-30 lg:h-22
    before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-transparent before:via-[#C7AE6A] before:to-transparent
    after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-gradient-to-r after:from-transparent after:via-[#C7AE6A] after:to-transparent
    bg-gradient-to-br from-neutral-900/90 to-neutral-800/80"
>
  <div className="flex items-center lg:justify-end px-4 lg:px-6 py-6 justify-between sm:gap-6">
    {/* Logo */}
    <Image src="/logo.webp" alt="Logo" width={180} height={30} className='lg:hidden'/>

    {/* Search (hidden on mobile) */}
    <div className='flex gap-4'>
    <div className="relative hidden lg:flex items-center justify-end ">
      <input
        placeholder={t('header.searchPlaceholder')}
        className="h-10 w-64 rounded-full border border-white/10 bg-[#1D1D1D] px-3 py-2 text-sm placeholder-neutral-500 outline-none focus:ring-2 focus:ring-[#C7AE6A]"
      />
      <Search size={16} className="absolute right-3 text-neutral-500" />
    </div>

    {/* User dropdown button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setUserOpen((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#2D291F] px-6 lg:px-4 py-2 "
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[#C7AE6A] text-black font-semibold">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm sm:inline">{firstName}</span>
          <ChevronDown size={16} className="text-[#C7AE6A]" />
        </button>

        {userOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-neutral-900 p-2 z-100">
            <Link
              href={`${base}/account`}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-white/5"
            >
              Il mio account
            </Link>
            <Link
              href={`${base}/change-password`}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-200 hover:bg-white/5"
            >
              Cambio password
            </Link>
            <Link
              href={`${base}/logout`}
              className="block rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-white/5"
            >
              {t('nav.logout')}
            </Link>
          </div>
        )}
      </div>
    </div>
  </div>
</header>
  );
}
