import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const gridColumnVariants = tv({
  variants: {
    span: {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
      full: 'col-span-full',
    },
    smSpan: {
      1: 'sm:col-span-1',
      2: 'sm:col-span-2',
      3: 'sm:col-span-3',
      4: 'sm:col-span-4',
      5: 'sm:col-span-5',
      6: 'sm:col-span-6',
      7: 'sm:col-span-7',
      8: 'sm:col-span-8',
      9: 'sm:col-span-9',
      10: 'sm:col-span-10',
      11: 'sm:col-span-11',
      12: 'sm:col-span-12',
      full: 'sm:col-span-full',
    },
    mdSpan: {
      1: 'md:col-span-1',
      2: 'md:col-span-2',
      3: 'md:col-span-3',
      4: 'md:col-span-4',
      5: 'md:col-span-5',
      6: 'md:col-span-6',
      7: 'md:col-span-7',
      8: 'md:col-span-8',
      9: 'md:col-span-9',
      10: 'md:col-span-10',
      11: 'md:col-span-11',
      12: 'md:col-span-12',
      full: 'md:col-span-full',
    },
    lgSpan: {
      1: 'lg:col-span-1',
      2: 'lg:col-span-2',
      3: 'lg:col-span-3',
      4: 'lg:col-span-4',
      5: 'lg:col-span-5',
      6: 'lg:col-span-6',
      7: 'lg:col-span-7',
      8: 'lg:col-span-8',
      9: 'lg:col-span-9',
      10: 'lg:col-span-10',
      11: 'lg:col-span-11',
      12: 'lg:col-span-12',
      full: 'lg:col-span-full',
    },
    xlSpan: {
      1: 'xl:col-span-1',
      2: 'xl:col-span-2',
      3: 'xl:col-span-3',
      4: 'xl:col-span-4',
      5: 'xl:col-span-5',
      6: 'xl:col-span-6',
      7: 'xl:col-span-7',
      8: 'xl:col-span-8',
      9: 'xl:col-span-9',
      10: 'xl:col-span-10',
      11: 'xl:col-span-11',
      12: 'xl:col-span-12',
      full: 'xl:col-span-full',
    },
    '2xlSpan': {
      1: '2xl:col-span-1',
      2: '2xl:col-span-2',
      3: '2xl:col-span-3',
      4: '2xl:col-span-4',
      5: '2xl:col-span-5',
      6: '2xl:col-span-6',
      7: '2xl:col-span-7',
      8: '2xl:col-span-8',
      9: '2xl:col-span-9',
      10: '2xl:col-span-10',
      11: '2xl:col-span-11',
      12: '2xl:col-span-12',
      full: '2xl:col-span-full',
    },
    start: {
      1: 'col-start-1',
      2: 'col-start-2',
      3: 'col-start-3',
      4: 'col-start-4',
      5: 'col-start-5',
      6: 'col-start-6',
      7: 'col-start-7',
      8: 'col-start-8',
      9: 'col-start-9',
      10: 'col-start-10',
      11: 'col-start-11',
      12: 'col-start-12',
      13: 'col-start-13',
      auto: 'col-start-auto',
    },
    end: {
      1: 'col-end-1',
      2: 'col-end-2',
      3: 'col-end-3',
      4: 'col-end-4',
      5: 'col-end-5',
      6: 'col-end-6',
      7: 'col-end-7',
      8: 'col-end-8',
      9: 'col-end-9',
      10: 'col-end-10',
      11: 'col-end-11',
      12: 'col-end-12',
      13: 'col-end-13',
      auto: 'col-end-auto',
    },
    order: {
      1: 'order-1',
      2: 'order-2',
      3: 'order-3',
      4: 'order-4',
      5: 'order-5',
      6: 'order-6',
      7: 'order-7',
      8: 'order-8',
      9: 'order-9',
      10: 'order-10',
      11: 'order-11',
      12: 'order-12',
      first: 'order-first',
      last: 'order-last',
      none: 'order-none',
    },
  },
  defaultVariants: {
    span: 1,
  },
});

export { gridColumnVariants };

type GridColumnVariants = VariantProps<typeof gridColumnVariants>;

type ResponsiveColumnProps = {
  sm?: { span?: GridColumnVariants['span'] };
  md?: { span?: GridColumnVariants['span'] };
  lg?: { span?: GridColumnVariants['span'] };
  xl?: { span?: GridColumnVariants['span'] };
  '2xl'?: { span?: GridColumnVariants['span'] };
};

type GridColumnBaseProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Pick<GridColumnVariants, 'span' | 'start' | 'end' | 'order'> &
  ResponsiveColumnProps;

export type GridColumnProps<T extends ElementType = 'div'> =
  GridColumnBaseProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof GridColumnBaseProps<T>>;

export default function GridColumn<T extends ElementType = 'div'>({
  as,
  span,
  start,
  end,
  order,
  sm,
  md,
  lg,
  xl,
  '2xl': xl2,
  className,
  children,
  ...props
}: GridColumnProps<T>) {
  const Component = as || 'div';

  return (
    <Component
      className={gridColumnVariants({
        span,
        start,
        end,
        order,
        smSpan: sm?.span,
        mdSpan: md?.span,
        lgSpan: lg?.span,
        xlSpan: xl?.span,
        '2xlSpan': xl2?.span,
        className,
      })}
      {...props}
    >
      {children}
    </Component>
  );
}
