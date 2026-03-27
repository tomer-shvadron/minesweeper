import { useGameStore } from '@/stores/game.store'
import { useUIStore } from '@/stores/ui.store'

export const useGameOverBannerLogic = () => {
  const status = useGameStore((s) => s.status)
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds)
  const board = useGameStore((s) => s.board)
  const totalClicks = useGameStore((s) => s.totalClicks)
  const startNewGame = useGameStore((s) => s.startNewGame)
  const highScoreEntry = useUIStore((s) => s.highScoreEntry)
  const openNewGameModal = useUIStore((s) => s.openNewGameModal)

  const isVisible = (status === 'won' || status === 'lost') && highScoreEntry === null

  const cellsRevealed = board.flat().filter((c) => c.isRevealed && !c.hasMine).length
  const efficiency = totalClicks > 0 ? cellsRevealed / totalClicks : null

  return {
    isVisible,
    isWon: status === 'won',
    elapsedSeconds,
    efficiency,
    handlePlayAgain: () => startNewGame(),
    handleChangeLevel: openNewGameModal,
  }
}
