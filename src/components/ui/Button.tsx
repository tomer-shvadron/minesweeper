import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva('inline-flex cursor-pointer items-center justify-center select-none', {
  variants: {
    variant: {
      raised:
        'bg-[var(--color-surface)] shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)] py-1 px-3 text-sm',
      primary:
        'bg-[var(--color-surface)] shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)] py-1.5 px-5 text-base font-bold',
      secondary:
        'bg-[var(--color-surface)] border border-[var(--color-border-dark)] py-1.5 px-4 text-base',
      ghost: 'bg-transparent py-1 px-2 text-sm',
    },
  },
  defaultVariants: { variant: 'raised' },
});

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
