interface LcdDisplayProps {
  value: number;
  digits?: number;
}

export const LcdDisplay = ({ value, digits = 3 }: LcdDisplayProps) => {
  const maxPositive = Math.pow(10, digits) - 1;
  const maxNegative = -(Math.pow(10, digits - 1) - 1);

  const clamped = Math.max(maxNegative, Math.min(maxPositive, value));

  let display: string;
  if (clamped < 0) {
    display = `-${Math.abs(clamped)
      .toString()
      .padStart(digits - 1, '0')}`;
  } else {
    display = clamped.toString().padStart(digits, '0');
  }

  return (
    <div className="lcd-display" aria-live="polite" aria-atomic="true" aria-label={`${value}`}>
      {display}
    </div>
  );
};
