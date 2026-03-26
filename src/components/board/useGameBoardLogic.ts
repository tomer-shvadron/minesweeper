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

  useEffect(() => {
    resetZoom()
  }, [boardWidth, boardHeight, resetZoom])

  // screen.orientation fires after the browser commits new dimensions, more reliable
  // than `resize` alone. Delay matches the 100ms recalculation in useGameLayout.
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

  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      resetZoom()
    }
  }, [status, resetZoom])

  return { board, config, cellSize, boardWidth, boardHeight, scale, panX, panY, pinchHandlers }
}
