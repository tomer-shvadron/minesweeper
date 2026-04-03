interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export const SegmentedControl = <T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => (
  <div className="flex items-center justify-between gap-3 text-[0.9375rem]">
    <span>{label}</span>
    <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`cursor-pointer border-none px-3 py-1 text-sm transition-colors duration-100 ${
            value === opt.value
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2,var(--color-surface))]'
          }`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);
