import { useGameStore } from '@/stores/game.store';
import { selectIsGameOver } from '@/stores/selectors';
import type { CellState } from '@/types/game.types';
import { cn } from '@/utils/cn';

const NUMBER_COLOR_CLASSES: Record<number, string> = {
  1: 'text-[var(--color-n1)]',
  2: 'text-[var(--color-n2)]',
  3: 'text-[var(--color-n3)]',
  4: 'text-[var(--color-n4)]',
  5: 'text-[var(--color-n5)]',
  6: 'text-[var(--color-n6)]',
  7: 'text-[var(--color-n7)]',
  8: 'text-[var(--color-n8)]',
};

interface UseCellLogicProps {
  cell: CellState;
}

export const useCellLogic = ({ cell }: UseCellLogicProps) => {
  const isGameOver = useGameStore(selectIsGameOver);

  const getContent = (): string => {
    if (!cell.isRevealed) {
      if (cell.isFlagged) {
        return '🚩';
      }
      if (cell.isQuestionMark) {
        return '?';
      }
      return '';
    }
    if (cell.isExploded) {
      return '💣';
    }
    if (cell.hasMine) {
      return '💣';
    }
    if (cell.value === 0) {
      return '';
    }
    return String(cell.value);
  };

  const isRaised = !cell.isRevealed;
  const isExploded = cell.isExploded;
  // Cell was correctly flagged — show a green checkmark badge on game over
  const isCorrectFlag = isGameOver && cell.isFlagged && cell.hasMine;

  const containerClass = cn(
    'cell',
    isRaised
      ? 'shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)]'
      : 'cell-revealed',
    isExploded && 'cell-exploded',
    (isGameOver || !isRaised) && 'cursor-default',
    !isGameOver && isRaised && 'cursor-pointer'
  );

  const numberClass = cn(
    cell.isRevealed && !cell.hasMine && cell.value > 0 && 'font-bold',
    cell.isRevealed && !cell.hasMine && cell.value > 0 && NUMBER_COLOR_CLASSES[cell.value]
  );

  return {
    content: getContent(),
    containerClass,
    numberClass,
    isCorrectFlag,
  };
};
