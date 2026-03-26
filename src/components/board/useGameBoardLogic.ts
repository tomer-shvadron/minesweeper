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

  // Reset zoom whenever board pixel dimensions change — covers three cases:
  //   1. New game with a different board size
  //   2. Orientation change (portrait ↔ landscape) — cellSize recalculates, changing boardWidth/boardHeight
  //   3. Window resize on desktop
  useEffect(() => {
    resetZoom()
  }, [boardWidth, boardHeight, resetZoom])

  // Zoom out automatically when the game ends so the full board is visible
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      resetZoom()
    }
  }, [status, resetZoom])

  return { board, config, cellSize, boardWidth, boardHeight, scale, panX, panY, pinchHandlers }
}
