import { useEffect } from 'react'

import { useGameLayout } from '@/hooks/useGameLayout'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import { useGameStore } from '@/stores/game.store'

export const useGameBoardLogic = () => {
  const board = useGameStore((s) => s.board)
  const status = useGameStore((s) => s.status)
  const { cellSize, boardWidth, boardHeight, config } = useGameLayout()
  const {
    scale,
    panX,
    panY,
    handlers: pinchHandlers,
    resetZoom,
  } = usePinchZoom(1, 5, boardWidth, boardHeight)

  // Reset zoom when board size changes (new game with different difficulty)
  useEffect(() => {
    resetZoom()
  }, [config.rows, config.cols, config.mines, resetZoom])

  // Zoom out automatically when the game ends so the full board is visible
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      resetZoom()
    }
  }, [status, resetZoom])

  return { board, config, cellSize, boardWidth, boardHeight, scale, panX, panY, pinchHandlers }
}
