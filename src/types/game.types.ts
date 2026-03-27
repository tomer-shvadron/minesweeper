export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 0 = empty, 1-8 = adjacent mine count

export interface CellState {
  hasMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isQuestionMark: boolean;
  value: CellValue; // number of adjacent mines (0-8)
  isExploded: boolean; // the specific mine the player clicked
}

export type Board = CellState[][];

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost' | 'generating';

export interface BoardConfig {
  rows: number;
  cols: number;
  mines: number;
}

export type BoardKey = 'beginner' | 'intermediate' | 'expert' | `${number}x${number}x${number}`;
