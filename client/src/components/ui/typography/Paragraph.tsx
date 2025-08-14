import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/utils/cn';

const paragraphVariants = tv({
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    color: {
      auto: 'text-gray-600 dark:text-white',
      gold: 'text-[#C7AE6A]',
      secondary: 'text-gray-600',
      white: 'text-white',
      muted: 'text-gray-500',
      contrast: 'text-black dark:text-white'
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
  },
  defaultVariants: {
    size: 'base',
    color: 'auto',
    weight: 'normal',
    align: 'left',
  },
});

export { paragraphVariants };

type ParagraphVariants = VariantProps<typeof paragraphVariants>;

export interface ParagraphProps
  extends Omit<ComponentPropsWithoutRef<'p'>, 'color'>,
    ParagraphVariants {
  className?: string;
}

export default forwardRef<ComponentRef<'p'>, ParagraphProps>(function Paragraph(
  { size, color, weight, align, className, children, ...props },
  ref
) {
  const base = paragraphVariants({ size, color, weight, align });
  return (
    <p className={cn(base, className)} ref={ref} {...props}>
      {children}
    </p>
  );
});
