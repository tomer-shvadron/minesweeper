import { useEffect, useState } from 'react'

import { useGameStore } from '@/stores/game.store'
import { calcCellSize } from '@/utils/layout.utils'

/**
 * Shared layout hook — computes cell size and board pixel dimensions.
 * Re-computes on window resize and when board config changes.
 * Used by both GameBoard and Header so they always match.
 */
export const useGameLayout = () => {
  const config = useGameStore((s) => s.config)

  const [cellSize, setCellSize] = useState(() => calcCellSize(config.rows, config.cols))

  useEffect(() => {
    const recalc = () => setCellSize(calcCellSize(config.rows, config.cols))
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [config.rows, config.cols])

  return {
    cellSize,
    boardWidth: cellSize * config.cols,
    boardHeight: cellSize * config.rows,
    config,
  }
}
