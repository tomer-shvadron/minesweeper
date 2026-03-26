import { useEffect } from 'react'

import { useGameLayout } from '@/hooks/useGameLayout'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import { useGameStore } from '@/stores/game.store'

export const useGameBoardLogic = () => {
  const board = useGameStore((s) => s.board)
  const { cellSize, boardWidth, boardHeight, config } = useGameLayout()
  const {
    scale,
    panX,
    panY,
    handlers: pinchHandlers,
    resetZoom,
  } = usePinchZoom(1, 5, boardWidth, boardHeight)

  useEffect(() => {
    resetZoom()
  }, [config.rows, config.cols, config.mines, resetZoom])

  return { board, config, cellSize, boardWidth, boardHeight, scale, panX, panY, pinchHandlers }
}
