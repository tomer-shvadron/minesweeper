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
      <span className="game-over-result-text">
        {isWon ? '😎 You won!' : '💣 Game over'}
        {isWon && <span className="game-over-time"> · {formatTime(elapsedSeconds)}</span>}
      </span>
      <div className="game-over-actions">
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
