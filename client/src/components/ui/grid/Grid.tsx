import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const gridVariants = tv({
  base: 'grid',
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    },
    smCols: {
      1: 'sm:grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-3',
      4: 'sm:grid-cols-4',
      5: 'sm:grid-cols-5',
      6: 'sm:grid-cols-6',
      7: 'sm:grid-cols-7',
      8: 'sm:grid-cols-8',
      9: 'sm:grid-cols-9',
      10: 'sm:grid-cols-10',
      11: 'sm:grid-cols-11',
      12: 'sm:grid-cols-12',
    },
    mdCols: {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
      5: 'md:grid-cols-5',
      6: 'md:grid-cols-6',
      7: 'md:grid-cols-7',
      8: 'md:grid-cols-8',
      9: 'md:grid-cols-9',
      10: 'md:grid-cols-10',
      11: 'md:grid-cols-11',
      12: 'md:grid-cols-12',
    },
    lgCols: {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
      5: 'lg:grid-cols-5',
      6: 'lg:grid-cols-6',
      7: 'lg:grid-cols-7',
      8: 'lg:grid-cols-8',
      9: 'lg:grid-cols-9',
      10: 'lg:grid-cols-10',
      11: 'lg:grid-cols-11',
      12: 'lg:grid-cols-12',
    },
    xlCols: {
      1: 'xl:grid-cols-1',
      2: 'xl:grid-cols-2',
      3: 'xl:grid-cols-3',
      4: 'xl:grid-cols-4',
      5: 'xl:grid-cols-5',
      6: 'xl:grid-cols-6',
      7: 'xl:grid-cols-7',
      8: 'xl:grid-cols-8',
      9: 'xl:grid-cols-9',
      10: 'xl:grid-cols-10',
      11: 'xl:grid-cols-11',
      12: 'xl:grid-cols-12',
    },
    '2xlCols': {
      1: '2xl:grid-cols-1',
      2: '2xl:grid-cols-2',
      3: '2xl:grid-cols-3',
      4: '2xl:grid-cols-4',
      5: '2xl:grid-cols-5',
      6: '2xl:grid-cols-6',
      7: '2xl:grid-cols-7',
      8: '2xl:grid-cols-8',
      9: '2xl:grid-cols-9',
      10: '2xl:grid-cols-10',
      11: '2xl:grid-cols-11',
      12: '2xl:grid-cols-12',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
      16: 'gap-16',
    },
    gapX: {
      0: 'gap-x-0',
      1: 'gap-x-1',
      2: 'gap-x-2',
      3: 'gap-x-3',
      4: 'gap-x-4',
      5: 'gap-x-5',
      6: 'gap-x-6',
      8: 'gap-x-8',
      10: 'gap-x-10',
      12: 'gap-x-12',
      16: 'gap-x-16',
    },
    gapY: {
      0: 'gap-y-0',
      1: 'gap-y-1',
      2: 'gap-y-2',
      3: 'gap-y-3',
      4: 'gap-y-4',
      5: 'gap-y-5',
      6: 'gap-y-6',
      8: 'gap-y-8',
      10: 'gap-y-10',
      12: 'gap-y-12',
      16: 'gap-y-16',
    },
  },
  defaultVariants: {
    cols: 12,
    gap: 4,
  },
});

export { gridVariants };

type GridVariants = VariantProps<typeof gridVariants>;

type ResponsiveGridProps = {
  sm?: { cols?: GridVariants['cols'] };
  md?: { cols?: GridVariants['cols'] };
  lg?: { cols?: GridVariants['cols'] };
  xl?: { cols?: GridVariants['cols'] };
  '2xl'?: { cols?: GridVariants['cols'] };
};

type GridBaseProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Pick<GridVariants, 'cols' | 'gap' | 'gapX' | 'gapY'> &
  ResponsiveGridProps;

export type GridProps<T extends ElementType = 'div'> = GridBaseProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof GridBaseProps<T>>;

export default function Grid<T extends ElementType = 'div'>({
  as,
  cols,
  gap,
  gapX,
  gapY,
  sm,
  md,
  lg,
  xl,
  '2xl': xl2,
  className,
  children,
  ...props
}: GridProps<T>) {
  const Component = as || 'div';

  return (
    <Component
      className={gridVariants({
        cols,
        gap,
        gapX,
        gapY,
        smCols: sm?.cols,
        mdCols: md?.cols,
        lgCols: lg?.cols,
        xlCols: xl?.cols,
        '2xlCols': xl2?.cols,
        className,
      })}
      {...props}
    >
      {children}
    </Component>
  );
}
