import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

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
      gold: 'text-[#C7AE6A]',
      secondary: 'text-gray-600',
      white: 'text-white',
      muted: 'text-gray-500',
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
    color: 'gold',
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
  return (
    <p
      className={paragraphVariants({
        size,
        color,
        weight,
        align,
        className,
      })}
      ref={ref}
      {...props}
    >
      {children}
    </p>
  );
});
