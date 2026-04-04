import type { CellState } from '@/types/game.types';

/** Create an unrevealed cell with optional overrides. */
export const unrevealed = (overrides?: Partial<CellState>): CellState => ({
  hasMine: false,
  isRevealed: false,
  isFlagged: false,
  isQuestionMark: false,
  value: 0,
  isExploded: false,
  ...overrides,
});

/** Create a revealed cell with the given value (default 0). */
export const revealed = (value: CellState['value'] = 0): CellState => ({
  ...unrevealed(),
  isRevealed: true,
  value,
});

/** Create a flagged (unrevealed) cell. */
export const flagged = (overrides?: Partial<CellState>): CellState => ({
  ...unrevealed(),
  isFlagged: true,
  ...overrides,
});

/** Create an unrevealed mine cell. */
export const mine = (overrides?: Partial<CellState>): CellState => ({
  ...unrevealed(),
  hasMine: true,
  ...overrides,
});
