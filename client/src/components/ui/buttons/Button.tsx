'use client';

import * as React from 'react';
import Link from 'next/link';
import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: [
    'inline-flex items-center rounded-full cursor-pointer select-none',
    'transition-transform duration-100 hover:-translate-y-0.5', // ≈ -2px
    'disabled:opacity-60 disabled:cursor-not-allowed'
  ].join(' '),
  variants: {
    variant: {
      primary: [
        'bg-[#C7AE6A] text-black font-semibold hover:bg-[#B29A59]',
        'hover:shadow-[0_8px_25px_rgba(199,174,106,0.5)]' // box-shadow custom la hover
      ].join(' '),
      secondary:
        'bg-[#171717] text-gray-300 border-2 border-[#28261F] hover:border-[#C7AE6A33] hover:text-[#C7AE6A]',
      ghost: 'bg-transparent text-gray-200 hover:bg-white/5'
    },
    size: {
      sm: 'text-sm px-4 py-2',
      md: 'text-sm lg:text-md px-4 py-3 lg:px-8 lg:py-4',
      lg: 'text-base px-6 py-4 lg:px-10 lg:py-5'
    },
    fullWidth: {
      true: 'w-full justify-center',
      false: ''
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false
  }
});

export { buttonVariants };

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Link: dacă este setat, randează <Link> în loc de <button> */
    href?: string;
    /** Icon stânga (ex: <ArrowLeft size={16} />) */
    leftIcon?: React.ReactNode;
    /** Icon dreapta (ex: <ArrowRight size={16} />) */
    rightIcon?: React.ReactNode;
    /** Clase suplimentare Tailwind */
    className?: string;
  };

export function Button({
  href,
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = buttonVariants({ variant, size, fullWidth, class: className });

  const content = (
    <>
      {leftIcon ? <span className="mr-2 inline-flex items-center">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="ml-2 inline-flex items-center">{rightIcon}</span> : null}
    </>
  );

  if (href) {
    // Link render
    return (
      <Link href={href} className={cls} aria-label={rest['aria-label']}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" {...rest} className={cls}>
      {content}
    </button>
  );
}

export default Button;
