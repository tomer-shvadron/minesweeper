import { useCellLogic } from './useCellLogic'

import type { CellState } from '@/types/game.types'

interface CellProps {
  row: number
  col: number
  cell: CellState
  cellSize: number
  isFocused?: boolean
  mineRevealIndex?: number
  chordRippleDelay?: number
}

export const Cell = ({
  row,
  col,
  cell,
  cellSize,
  isFocused,
  mineRevealIndex,
  chordRippleDelay,
}: CellProps) => {
  const { content, containerClass, numberClass, isCorrectFlag, handlers } = useCellLogic({
    row,
    col,
    cell,
  })

  const fontSize =
    cell.isRevealed && !cell.hasMine && cell.value > 0
      ? Math.floor(cellSize * 0.65)
      : Math.floor(cellSize * 0.72)

  const animClass = [
    mineRevealIndex !== undefined ? 'cell--mine-reveal' : '',
    chordRippleDelay !== undefined ? 'cell--chord-ripple' : '',
    isFocused ? 'cell-focused' : '',
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
      className={`relative ${animClass ? `${containerClass} ${animClass}` : containerClass}`}
      aria-label={`Cell ${row},${col}`}
      data-row={row}
      data-col={col}
      {...handlers}
    >
      <span className={numberClass}>{content}</span>
      {isCorrectFlag && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 leading-none font-bold text-green-500"
          style={{ fontSize: Math.max(8, Math.floor(cellSize * 0.35)) }}
        >
          ✓
        </span>
      )}
    </button>
  )
}
