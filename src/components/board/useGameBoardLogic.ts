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

  // Reset zoom whenever board pixel dimensions change — covers:
  //   • New game with a different board size
  //   • Window resize on desktop
  //   • Orientation change when cellSize differs between orientations
  useEffect(() => {
    resetZoom()
  }, [boardWidth, boardHeight, resetZoom])

  // Explicitly reset zoom on orientation change via the modern screen.orientation API
  // (fires after the browser commits new dimensions, more reliable than `resize` alone).
  // Delay matches the 100ms layout recalculation in useGameLayout so zoom resets
  // after the new cell size has been applied.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const handleOrientationChange = () => {
      timer = setTimeout(resetZoom, 150)
    }

    const orientationObj = window.screen?.orientation
    if (orientationObj) {
      orientationObj.addEventListener('change', handleOrientationChange)
    } else {
      // Fallback for older iOS / Safari
      window.addEventListener('orientationchange', handleOrientationChange)
    }

    return () => {
      clearTimeout(timer)
      if (orientationObj) {
        orientationObj.removeEventListener('change', handleOrientationChange)
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange)
      }
    }
  }, [resetZoom])

  // Zoom out automatically when the game ends so the full board is visible
  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      resetZoom()
    }
  }, [status, resetZoom])

  return { board, config, cellSize, boardWidth, boardHeight, scale, panX, panY, pinchHandlers }
}
