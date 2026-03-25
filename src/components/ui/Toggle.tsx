import * as SwitchPrimitive from '@radix-ui/react-switch'

interface ToggleProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export const Toggle = ({ id, label, checked, onChange, disabled = false }: ToggleProps) => (
  <div className="toggle-row">
    <label className="toggle-label" htmlFor={id}>
      {label}
    </label>
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className="switch-root"
    >
      <SwitchPrimitive.Thumb className="switch-thumb" />
    </SwitchPrimitive.Root>
  </div>
)
