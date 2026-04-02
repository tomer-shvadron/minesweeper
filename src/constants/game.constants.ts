import type { BoardConfig } from '@/types/game.types';

export const DIFFICULTY_PRESETS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
} satisfies Record<string, BoardConfig>;

export const MIN_ROWS = 5;
export const MAX_ROWS = 30;
export const MIN_COLS = 5;
export const MAX_COLS = 50;
export const MIN_MINES = 1;
/** First click + 8 neighbors must be safe. */
export const SAFE_ZONE_SIZE = 9;
export const CANVAS_THRESHOLD = 250;
