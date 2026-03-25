import { type ButtonHTMLAttributes } from 'react'

import { cn } from '@/utils/cn'

export type ButtonVariant = 'raised' | 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

/**
 * Generic button primitive used across the UI (modals, header controls, etc.).
 * For game cells, see Cell.tsx which has its own bevel styling.
 */
export const Button = ({ variant = 'raised', className, children, ...props }: ButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center justify-center select-none',
        variant === 'raised' && 'btn-raised',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
