import * as SwitchPrimitive from '@radix-ui/react-switch'

interface ToggleProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export const Toggle = ({ id, label, checked, onChange, disabled = false }: ToggleProps) => (
  <div className="flex items-center justify-between gap-3 text-base">
    <label className="flex-1" htmlFor={id}>
      {label}
    </label>
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className="relative h-6 w-[42px] shrink-0 cursor-pointer rounded-full border-none bg-[var(--color-border-dark)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-[var(--color-n4)]"
    >
      <SwitchPrimitive.Thumb className="block h-[18px] w-[18px] translate-x-[3px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-150 data-[state=checked]:translate-x-[21px]" />
    </SwitchPrimitive.Root>
  </div>
)
