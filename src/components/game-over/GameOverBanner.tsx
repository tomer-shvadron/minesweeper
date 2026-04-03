import { useGameOverBannerLogic } from './useGameOverBannerLogic';

import { Button } from '@/components/ui/Button';
import { formatTime } from '@/utils/time.utils';

export const GameOverBanner = () => {
  const {
    isVisible,
    isWon,
    elapsedSeconds,
    efficiency,
    cellsRevealed,
    minesFlagged,
    handlePlayAgain,
    handleChangeLevel,
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
      <div className="game-over-card">
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

        {/* Stats */}
        <div className="flex justify-center gap-6 text-sm text-[var(--color-text-muted)]">
          {isWon && efficiency !== null && <span>×{efficiency.toFixed(1)} per click</span>}
          {!isWon && (
            <>
              <span>{cellsRevealed} revealed</span>
              <span>{minesFlagged} flagged</span>
            </>
          )}
        </div>

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
