import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/utils/cn'

const buttonVariants = cva('inline-flex cursor-pointer items-center justify-center select-none', {
  variants: {
    variant: {
      raised: 'btn-raised',
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
    },
  },
  defaultVariants: { variant: 'raised' },
})

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
)
Button.displayName = 'Button'
