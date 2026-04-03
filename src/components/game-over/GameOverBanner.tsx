import { X } from 'lucide-react';

import { useGameOverBannerLogic } from './useGameOverBannerLogic';

import { Button } from '@/components/ui/Button';
import { formatTime } from '@/utils/time.utils';

export const GameOverBanner = () => {
  const {
    isVisible,
    isWon,
    elapsedSeconds,
    cellsRevealed,
    minesFlagged,
    handlePlayAgain,
    handleChangeLevel,
    handleDismiss,
  } = useGameOverBannerLogic();

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="game-over-overlay"
      data-testid="game-over-banner"
      role="status"
      aria-live="polite"
    >
      {/* Invisible backdrop button for dismiss-on-click-outside */}
      <button
        type="button"
        className="absolute inset-0 cursor-default border-none bg-transparent"
        aria-label="Dismiss"
        onClick={handleDismiss}
        tabIndex={-1}
      />
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="game-over-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          type="button"
          className="absolute top-3 right-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2,var(--color-surface))] text-[var(--color-text-muted)] transition-colors duration-100 hover:bg-[var(--color-border)] hover:text-[var(--color-text)]"
          aria-label="Close"
          onClick={handleDismiss}
        >
          <X size={14} strokeWidth={2} />
        </button>

        {/* Emoji + title */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">{isWon ? '🏆' : '💣'}</span>
          <h2
            className={`text-xl font-bold ${isWon ? 'text-[var(--color-accent)]' : 'text-[var(--color-n3,#ef4444)]'}`}
          >
            {isWon ? 'You Won!' : 'Game Over'}
          </h2>
        </div>

        {/* Time */}
        <p
          className={`text-center text-2xl font-extrabold tabular-nums ${
            isWon ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
          }`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatTime(elapsedSeconds)}
        </p>

        {/* Stats (loss only) */}
        {!isWon && (
          <div className="flex justify-center gap-6 text-sm text-[var(--color-text-muted)]">
            <span>{cellsRevealed} revealed</span>
            <span>{minesFlagged} flagged</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-center gap-3 pt-1">
          <Button
            variant="primary"
            onClick={handlePlayAgain}
            className={!isWon ? 'bg-[var(--color-n3,#ef4444)]' : ''}
          >
            {isWon ? 'Play Again' : 'Try Again'}
          </Button>
          <Button variant="secondary" onClick={handleChangeLevel}>
            Change Level
          </Button>
        </div>
      </div>
    </div>
  );
};
