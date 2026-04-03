import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center rounded-xl select-none transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
  {
    variants: {
      variant: {
        raised: 'btn-raised py-1.5 px-3.5 text-sm',
        primary: 'btn-primary py-2 px-6 text-base font-semibold',
        secondary: 'btn-secondary py-2 px-5 text-base',
        ghost:
          'bg-transparent py-1.5 px-2.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2,var(--color-surface))] hover:text-[var(--color-text)]',
      },
    },
    defaultVariants: { variant: 'raised' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';
