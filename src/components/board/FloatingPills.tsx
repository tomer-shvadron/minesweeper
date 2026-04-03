import { Bomb, Timer } from 'lucide-react';

import { useFloatingPillsLogic } from './useFloatingPillsLogic';

export const FloatingPills = () => {
  const { minesRemaining, elapsedSeconds, fontSize, iconSize, paddingX, paddingY, gap } =
    useFloatingPillsLogic();

  const pillClass =
    'flex items-center rounded-2xl border border-[var(--color-glass-border,var(--color-border))] bg-[var(--color-glass-bg,var(--color-surface))] shadow-sm backdrop-blur-xl';

  const pillStyle = {
    paddingLeft: paddingX,
    paddingRight: paddingX,
    paddingTop: paddingY,
    paddingBottom: paddingY,
    gap,
  };

  const numberStyle = {
    fontSize,
    fontVariantNumeric: 'tabular-nums' as const,
    lineHeight: 1,
    letterSpacing: '-0.02em',
  };

  return (
    <div className="flex w-full items-center justify-between px-1 pb-4">
      {/* Mine counter pill */}
      <div className={pillClass} style={pillStyle}>
        <Bomb size={iconSize} className="text-[var(--color-text-muted)]" strokeWidth={2} />
        <span
          className="font-extrabold text-[var(--color-text)]"
          style={numberStyle}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${minesRemaining} mines remaining`}
          data-testid="mine-counter"
        >
          {minesRemaining}
        </span>
      </div>

      {/* Timer pill */}
      <div className={pillClass} style={pillStyle}>
        <span
          className="font-extrabold text-[var(--color-text)]"
          style={numberStyle}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${elapsedSeconds} seconds elapsed`}
          data-testid="timer"
        >
          {String(elapsedSeconds).padStart(3, '0')}
        </span>
        <Timer size={iconSize} className="text-[var(--color-text-muted)]" strokeWidth={2} />
      </div>
    </div>
  );
};
