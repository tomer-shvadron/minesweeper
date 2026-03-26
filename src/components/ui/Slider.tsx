import * as SliderPrimitive from '@radix-ui/react-slider'

interface SliderProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export const Slider = ({ id, label, value, onChange, disabled = false }: SliderProps) => (
  <div className="flex items-center gap-[10px] text-base">
    <label className="min-w-14" htmlFor={id}>
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
      className="relative flex h-5 flex-1 cursor-pointer items-center data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40"
    >
      <SliderPrimitive.Track className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border-dark)]">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-[var(--color-n4)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-4 w-4 cursor-pointer rounded-full border-2 border-[var(--color-n4)] bg-white outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,80,0.3)]"
        aria-label={label}
      />
    </SliderPrimitive.Root>
    <span className="min-w-9 text-right">{Math.round(value * 100)}%</span>
  </div>
)
