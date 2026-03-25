import { useEffect } from 'react'

import { useGameLayout } from '@/hooks/useGameLayout'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import { useGameStore } from '@/stores/game.store'

export const useGameBoardLogic = () => {
  const board = useGameStore((s) => s.board)
  const { cellSize, boardWidth, boardHeight, config } = useGameLayout()
  const { scale, handlers: pinchHandlers, resetZoom } = usePinchZoom(1, 5)

  // Reset zoom whenever the board config changes
  useEffect(() => {
    resetZoom()
  }, [config.rows, config.cols, config.mines, resetZoom])

  return { board, config, cellSize, boardWidth, boardHeight, scale, pinchHandlers }
}
