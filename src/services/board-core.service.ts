import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import type { Board, BoardConfig, BoardKey, CellState, CellValue } from '@/types/game.types';

function createEmptyCell(): CellState {
  return {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    isQuestionMark: false,
    value: 0,
    isExploded: false,
  };
}

export function getNeighborCoords(board: Board, row: number, col: number): [number, number][] {
  const neighbors: [number, number][] = [];
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) {
        continue;
      }
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        neighbors.push([r, c]);
      }
    }
  }
  return neighbors;
}

export function deepCopyBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function createEmptyBoard(config: BoardConfig): Board {
  if (config.rows <= 0 || config.cols <= 0) {
    throw new Error(`Invalid board dimensions: ${config.rows}×${config.cols}`);
  }
  return Array.from({ length: config.rows }, () =>
    Array.from({ length: config.cols }, () => createEmptyCell())
  );
}

export function createBoardKey(config: BoardConfig): BoardKey {
  for (const [key, preset] of Object.entries(DIFFICULTY_PRESETS)) {
    if (
      preset.rows === config.rows &&
      preset.cols === config.cols &&
      preset.mines === config.mines
    ) {
      return key as BoardKey;
    }
  }
  return `${config.cols}x${config.rows}x${config.mines}`;
}

export function placeMines(
  board: Board,
  config: BoardConfig,
  safeRow: number,
  safeCol: number
): Board {
  const { rows, cols, mines } = config;
  const maxMines = rows * cols - 9; // safe zone = first click + 8 neighbors
  if (mines > maxMines) {
    throw new Error(`Too many mines (${mines}) for ${rows}×${cols} board (max: ${maxMines})`);
  }
  const newBoard = deepCopyBoard(board);

  const safeCells = new Set<number>();
  safeCells.add(safeRow * cols + safeCol);
  for (const [r, c] of getNeighborCoords(board, safeRow, safeCol)) {
    safeCells.add(r * cols + c);
  }

  const eligible: number[] = [];
  for (let i = 0; i < rows * cols; i++) {
    if (!safeCells.has(i)) {
      eligible.push(i);
    }
  }

  // Fisher-Yates shuffle and take first `mines` elements
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = eligible[i];
    const b = eligible[j];
    if (a !== undefined && b !== undefined) {
      eligible[i] = b;
      eligible[j] = a;
    }
  }

  const minesToPlace = Math.min(mines, eligible.length);
  for (let i = 0; i < minesToPlace; i++) {
    const idx = eligible[i];
    if (idx === undefined) {
      continue;
    }
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const row = newBoard[r];
    if (row) {
      const cell = row[c];
      if (cell) {
        cell.hasMine = true;
      }
    }
  }

  return newBoard;
}

export function calculateAdjacentValues(board: Board): Board {
  const newBoard = deepCopyBoard(board);
  const rows = newBoard.length;
  const cols = newBoard[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = newBoard[r]?.[c];
      if (!cell || cell.hasMine) {
        continue;
      }

      let count = 0;
      for (const [nr, nc] of getNeighborCoords(board, r, c)) {
        if (board[nr]?.[nc]?.hasMine) {
          count++;
        }
      }
      cell.value = count as CellValue;
    }
  }

  return newBoard;
}
