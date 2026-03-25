interface LcdDisplayProps {
  /** Numeric value to display */
  value: number
  /** Total number of character slots shown (default 3) */
  digits?: number
}

/**
 * Classic XP-style LCD digit display.
 * Shows a fixed-width number with leading zeros on a black background.
 * Negative values show a leading dash and are capped at -(10^(digits-1) - 1).
 */
export const LcdDisplay = ({ value, digits = 3 }: LcdDisplayProps) => {
  const maxPositive = Math.pow(10, digits) - 1 // 999 for 3 digits
  const maxNegative = -(Math.pow(10, digits - 1) - 1) // -99 for 3 digits

  const clamped = Math.max(maxNegative, Math.min(maxPositive, value))

  let display: string
  if (clamped < 0) {
    // e.g. -12 → "-12", -9 → "-09"
    display = `-${Math.abs(clamped)
      .toString()
      .padStart(digits - 1, '0')}`
  } else {
    display = clamped.toString().padStart(digits, '0')
  }

  return (
    <div className="lcd-display" aria-label={`${value}`}>
      {display}
    </div>
  )
}
