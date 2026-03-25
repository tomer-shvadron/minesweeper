import * as SliderPrimitive from '@radix-ui/react-slider'

interface SliderProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export const Slider = ({ id, label, value, onChange, disabled = false }: SliderProps) => (
  <div className="slider-row">
    <label className="slider-label" htmlFor={id}>
      {label}
    </label>
    <SliderPrimitive.Root
      id={id}
      min={0}
      max={1}
      step={0.05}
      value={[value]}
      onValueChange={([v]) => {
        onChange(v ?? 0)
      }}
      disabled={disabled}
      className="slider-root"
    >
      <SliderPrimitive.Track className="slider-track">
        <SliderPrimitive.Range className="slider-range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="slider-thumb" aria-label={label} />
    </SliderPrimitive.Root>
    <span className="slider-value">{Math.round(value * 100)}%</span>
  </div>
)
