interface SliderProps {
  id: string
  label: string
  value: number // 0–1
  onChange: (value: number) => void
  disabled?: boolean
}

/** Volume slider (0–1 range) used in SettingsModal. */
export const Slider = ({ id, label, value, onChange, disabled = false }: SliderProps) => {
  return (
    <div className="slider-row">
      <label className="slider-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        className="slider-input"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{Math.round(value * 100)}%</span>
    </div>
  )
}
