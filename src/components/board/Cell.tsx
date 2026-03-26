import { useCellLogic } from './useCellLogic'

import type { CellState } from '@/types/game.types'

interface CellProps {
  row: number
  col: number
  cell: CellState
  cellSize: number
  mineRevealIndex?: number
  chordRippleDelay?: number
}

export const Cell = ({
  row,
  col,
  cell,
  cellSize,
  mineRevealIndex,
  chordRippleDelay,
}: CellProps) => {
  const { content, containerClass, numberClass, handlers } = useCellLogic({ row, col, cell })

  const fontSize =
    cell.isRevealed && !cell.hasMine && cell.value > 0
      ? Math.floor(cellSize * 0.65)
      : Math.floor(cellSize * 0.72)

  const animClass = [
    mineRevealIndex !== undefined ? 'cell--mine-reveal' : '',
    chordRippleDelay !== undefined ? 'cell--chord-ripple' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      style={
        {
          width: cellSize,
          height: cellSize,
          fontSize,
          '--cell-row': row,
          '--cell-col': col,
          ...(mineRevealIndex !== undefined && { '--mine-delay': `${mineRevealIndex * 35}ms` }),
          ...(chordRippleDelay !== undefined && { '--chord-delay': `${chordRippleDelay}ms` }),
        } as React.CSSProperties
      }
      className={animClass ? `${containerClass} ${animClass}` : containerClass}
      aria-label={`Cell ${row},${col}`}
      data-row={row}
      data-col={col}
      {...handlers}
    >
      <span className={numberClass}>{content}</span>
    </button>
  )
}
