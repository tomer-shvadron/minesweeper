import { useEffect, useState } from 'react'

import { usePinchZoom } from '@/hooks/usePinchZoom'
import { useGameStore } from '@/stores/game.store'

const HEADER_HEIGHT = 56 // reserved for the header (Phase 4)
const PADDING = 16 // px on each side

function calcCellSize(rows: number, cols: number): number {
  const availW = window.innerWidth - PADDING * 2
  const availH = window.innerHeight - HEADER_HEIGHT - PADDING * 2
  const fromWidth = Math.floor(availW / cols)
  const fromHeight = Math.floor(availH / rows)
  // Fit the whole board on screen; never smaller than 12px (large custom boards)
  return Math.max(12, Math.min(fromWidth, fromHeight))
}

export const useGameBoardLogic = () => {
  const board = useGameStore((s) => s.board)
  const config = useGameStore((s) => s.config)
  const { scale, handlers: pinchHandlers, resetZoom } = usePinchZoom(1, 5)

  const [cellSize, setCellSize] = useState(() => calcCellSize(config.rows, config.cols))

  // Recalculate cell size on board config change or window resize
  useEffect(() => {
    const recalc = () => setCellSize(calcCellSize(config.rows, config.cols))
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [config.rows, config.cols])

  // Reset zoom whenever the board config changes
  useEffect(() => {
    resetZoom()
  }, [config.rows, config.cols, config.mines, resetZoom])

  return { board, config, cellSize, scale, pinchHandlers }
}
