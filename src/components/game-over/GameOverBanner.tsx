import { useGameOverBannerLogic } from './useGameOverBannerLogic'

import { Button } from '@/components/ui/Button'
import { formatTime } from '@/utils/time.utils'

export const GameOverBanner = () => {
  const { isVisible, isWon, elapsedSeconds, handlePlayAgain, handleChangeLevel } =
    useGameOverBannerLogic()

  if (!isVisible) {
    return null
  }

  return (
    <div className="game-over-banner" data-testid="game-over-banner">
      <span className="flex items-center gap-1 text-base font-bold">
        {isWon ? '😎 You won!' : '💣 Game over'}
        {isWon && (
          <span className="font-normal text-[var(--color-text-muted)]">
            {' '}
            · {formatTime(elapsedSeconds)}
          </span>
        )}
      </span>
      <div className="flex shrink-0 gap-[10px]">
        <Button variant="primary" onClick={handlePlayAgain}>
          Play Again
        </Button>
        <Button variant="secondary" onClick={handleChangeLevel}>
          Change Level
        </Button>
      </div>
    </div>
  )
}
