import {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactNode,
  createElement,
  ElementType,
} from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const containerVariants = tv({
  base: 'mx-auto',
  variants: {
    size: {
      sm: 'max-w-3xl', // ~768px
      md: 'max-w-5xl', // ~1024px
      lg: 'max-w-6xl', // ~1152px
      xl: 'max-w-7xl', // ~1280px
      '2xl': 'max-w-screen-2xl', // ~1536px
    },
    padding: {
      true: 'px-4',
      false: '',
    },
  },
  defaultVariants: {
    size: 'lg',
    padding: true,
  },
});

export { containerVariants };

type ContainerVariants = VariantProps<typeof containerVariants>;

export interface ContainerProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'className'>,
    ContainerVariants {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

export default forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { as = 'div', size, padding, className, children, ...props },
  ref
) {
  return createElement(
    as,
    {
      className: containerVariants({ size, padding, className }),
      ref,
      ...props,
    },
    children
  );
});
