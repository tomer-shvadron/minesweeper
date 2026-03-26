import { useGameStore } from '@/stores/game.store'
import { useUIStore } from '@/stores/ui.store'

export const useGameOverBannerLogic = () => {
  const status = useGameStore((s) => s.status)
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds)
  const startNewGame = useGameStore((s) => s.startNewGame)
  const highScoreEntry = useUIStore((s) => s.highScoreEntry)
  const openNewGameModal = useUIStore((s) => s.openNewGameModal)

  const isVisible = (status === 'won' || status === 'lost') && highScoreEntry === null

  return {
    isVisible,
    isWon: status === 'won',
    elapsedSeconds,
    handlePlayAgain: () => startNewGame(),
    handleChangeLevel: openNewGameModal,
  }
}
