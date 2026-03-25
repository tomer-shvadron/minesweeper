interface ToggleProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** XP-style checkbox toggle used in SettingsModal. */
export const Toggle = ({ id, label, checked, onChange, disabled = false }: ToggleProps) => {
  return (
    <label className="toggle-row" htmlFor={id}>
      <span className="toggle-label">{label}</span>
      <input
        id={id}
        type="checkbox"
        className="toggle-checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}
