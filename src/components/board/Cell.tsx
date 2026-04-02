import { useCellLogic } from './useCellLogic';

import { CELL_FONT_SCALE_ICON, CELL_FONT_SCALE_NUMBER } from '@/constants/ui.constants';
import type { CellState } from '@/types/game.types';

function cellAriaLabel(row: number, col: number, cell: CellState): string {
  const pos = `Row ${row + 1}, Column ${col + 1}`;
  if (!cell.isRevealed) {
    if (cell.isFlagged) {
      return `${pos}: flagged`;
    }
    if (cell.isQuestionMark) {
      return `${pos}: question mark`;
    }
    return `${pos}: unrevealed`;
  }
  if (cell.isExploded) {
    return `${pos}: mine, exploded`;
  }
  if (cell.hasMine) {
    return `${pos}: mine`;
  }
  if (cell.value === 0) {
    return `${pos}: empty`;
  }
  return `${pos}: ${cell.value} adjacent mine${cell.value > 1 ? 's' : ''}`;
}

interface CellProps {
  row: number;
  col: number;
  cell: CellState;
  cellSize: number;
  isFocused?: boolean;
  mineRevealIndex?: number;
  chordRippleDelay?: number;
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
  const { content, containerClass, numberClass, isCorrectFlag } = useCellLogic({ cell });

  const fontSize =
    cell.isRevealed && !cell.hasMine && cell.value > 0
      ? Math.floor(cellSize * CELL_FONT_SCALE_NUMBER)
      : Math.floor(cellSize * CELL_FONT_SCALE_ICON);

  const animClass = [
    mineRevealIndex !== undefined ? 'cell--mine-reveal' : '',
    chordRippleDelay !== undefined ? 'cell--chord-ripple' : '',
    isFocused ? 'cell-focused' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
      role="gridcell"
      className={`relative ${animClass ? `${containerClass} ${animClass}` : containerClass}`}
      aria-label={cellAriaLabel(row, col, cell)}
      data-row={row}
      data-col={col}
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
  );
};
