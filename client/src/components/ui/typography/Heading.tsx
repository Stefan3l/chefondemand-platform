import { ComponentPropsWithoutRef, ComponentRef, forwardRef } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

const headingVariants = tv({
  variants: {
    level: {
      h1: 'text-4xl font-bold',
      h2: 'text-3xl font-semibold',
      h3: 'text-2xl font-medium',
      h4: 'text-xl font-medium',
      h5: 'text-lg',
      h6: 'text-base',
    },
    color: {
      gold: 'text-[#C7AE6A]',
      white: 'text-white',
    },
  },
  defaultVariants: {
    level: 'h1',
    color: 'gold',
  },
});

export { headingVariants };

type HeadingVariants = VariantProps<typeof headingVariants>;
type HeadingLevel = NonNullable<HeadingVariants['level']>;

export interface HeadingProps
  extends Omit<ComponentPropsWithoutRef<HeadingLevel>, 'className' | 'color'>,
    HeadingVariants {
  level: HeadingLevel;
  className?: string;
}

export default forwardRef<ComponentRef<HeadingLevel>, HeadingProps>(
  function Heading({ level, color, className, children, ...props }, ref) {
    const Tag = level;

    return (
      <Tag
        className={headingVariants({ level, color, className })}
        ref={ref}
        {...props}
      >
        {children}
      </Tag>
    );
  }
);
