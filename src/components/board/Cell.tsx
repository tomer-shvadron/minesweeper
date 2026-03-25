import { useCellLogic } from './useCellLogic'

import type { CellState } from '@/types/game.types'

interface CellProps {
  row: number
  col: number
  cell: CellState
  cellSize: number
}

export const Cell = ({ row, col, cell, cellSize }: CellProps) => {
  const { content, containerClass, numberClass, handlers } = useCellLogic({ row, col, cell })

  const fontSize =
    cell.isRevealed && !cell.hasMine && cell.value > 0
      ? Math.floor(cellSize * 0.65) // number — slightly smaller
      : Math.floor(cellSize * 0.72) // icon/flag — slightly larger

  return (
    <button
      type="button"
      style={{ width: cellSize, height: cellSize, fontSize }}
      className={containerClass}
      aria-label={`Cell ${row},${col}`}
      {...handlers}
    >
      <span className={numberClass}>{content}</span>
    </button>
  )
}
