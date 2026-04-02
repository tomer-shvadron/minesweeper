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

function getNeighborCoords(board: Board, row: number, col: number): [number, number][] {
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

function deepCopyBoard(board: Board): Board {
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

export function revealAllMines(board: Board): Board {
  const newBoard = deepCopyBoard(board);
  for (const row of newBoard) {
    for (const cell of row) {
      if (cell.hasMine) {
        cell.isRevealed = true;
      }
    }
  }
  return newBoard;
}

// BFS flood-fill: stops at numbered cells (reveals them but doesn't continue through them)
export function floodFill(board: Board, row: number, col: number): Board {
  const newBoard = deepCopyBoard(board);
  const rows = newBoard.length;
  const cols = newBoard[0]?.length ?? 0;

  const queue: [number, number][] = [[row, col]];
  const visited = new Set<number>();
  visited.add(row * cols + col);

  let queueIdx = 0;
  while (queueIdx < queue.length) {
    const entry = queue[queueIdx++];
    if (!entry) {
      break;
    }
    const [r, c] = entry;
    const cell = newBoard[r]?.[c];
    if (!cell) {
      continue;
    }
    if (cell.hasMine || cell.isFlagged || cell.isQuestionMark) {
      continue;
    }

    cell.isRevealed = true;

    if (cell.value === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) {
            continue;
          }
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            continue;
          }
          const key = nr * cols + nc;
          if (visited.has(key)) {
            continue;
          }
          const neighbor = newBoard[nr]?.[nc];
          if (!neighbor) {
            continue;
          }
          if (neighbor.hasMine || neighbor.isFlagged || neighbor.isQuestionMark) {
            continue;
          }
          if (neighbor.isRevealed) {
            continue;
          }
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }

  return newBoard;
}

export function revealCell(board: Board, row: number, col: number): Board {
  const cell = board[row]?.[col];
  if (!cell) {
    return board;
  }

  if (cell.isRevealed) {
    return board;
  }
  if (cell.isFlagged || cell.isQuestionMark) {
    return board;
  }

  if (cell.hasMine) {
    const newBoard = revealAllMines(board);
    const explodedCell = newBoard[row]?.[col];
    if (explodedCell) {
      explodedCell.isExploded = true;
    }
    return newBoard;
  }

  if (cell.value === 0) {
    return floodFill(board, row, col);
  }

  // Sparse row copy for single numbered cell reveal
  return board.map((r, i) =>
    i === row ? r.map((c, j) => (j === col ? { ...c, isRevealed: true } : c)) : r
  );
}

export function chordReveal(board: Board, row: number, col: number): Board {
  const cell = board[row]?.[col];
  if (!cell || !cell.isRevealed || cell.value === 0) {
    return board;
  }

  const neighbors = getNeighborCoords(board, row, col);
  const flagCount = neighbors.filter(([r, c]) => board[r]?.[c]?.isFlagged).length;

  if (flagCount !== cell.value) {
    return board;
  }

  let newBoard = board;
  for (const [r, c] of neighbors) {
    const neighbor = newBoard[r]?.[c];
    if (!neighbor) {
      continue;
    }
    if (neighbor.isRevealed || neighbor.isFlagged || neighbor.isQuestionMark) {
      continue;
    }
    newBoard = revealCell(newBoard, r, c);
  }

  return newBoard;
}

export function toggleFlag(
  board: Board,
  row: number,
  col: number,
  allowQuestionMarks: boolean
): Board {
  const cell = board[row]?.[col];
  if (!cell) {
    return board;
  }
  if (cell.isRevealed) {
    return board;
  }

  let newIsFlagged = cell.isFlagged;
  let newIsQuestionMark = cell.isQuestionMark;

  if (!cell.isFlagged && !cell.isQuestionMark) {
    newIsFlagged = true;
  } else if (cell.isFlagged) {
    newIsFlagged = false;
    if (allowQuestionMarks) {
      newIsQuestionMark = true;
    }
  } else if (cell.isQuestionMark) {
    newIsQuestionMark = false;
  }

  // Sparse row copy: only copy the affected row, not the entire board
  return board.map((r, i) =>
    i === row
      ? r.map((c, j) =>
          j === col ? { ...c, isFlagged: newIsFlagged, isQuestionMark: newIsQuestionMark } : c
        )
      : r
  );
}

export function checkWin(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.hasMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

export function checkLoss(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (cell.hasMine && cell.isRevealed) {
        return true;
      }
    }
  }
  return false;
}

/** Count unrevealed safe cells on a board (for incremental win tracking). */
export function countUnrevealedSafe(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell.hasMine && !cell.isRevealed) {
        count++;
      }
    }
  }
  return count;
}

/** Count how many cells were newly revealed between oldBoard and newBoard. */
export function countNewlyRevealed(oldBoard: Board, newBoard: Board): number {
  let count = 0;
  for (let r = 0; r < oldBoard.length; r++) {
    const oldRow = oldBoard[r];
    const newRow = newBoard[r];
    if (!oldRow || !newRow) {
      continue;
    }
    for (let c = 0; c < oldRow.length; c++) {
      if (!oldRow[c]?.isRevealed && newRow[c]?.isRevealed) {
        count++;
      }
    }
  }
  return count;
}

export function countRemainingFlags(board: Board, totalMines: number): number {
  let flagged = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isFlagged) {
        flagged++;
      }
    }
  }
  return totalMines - flagged;
}

export function isBoardSolvable(board: Board, firstClick: [number, number]): boolean {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  // Solver's knowledge state
  const revealed: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );
  const solverFlagged: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );

  // Flood-fill reveal from a cell (respects solver state, not hasMine)
  const floodReveal = (startRow: number, startCol: number): void => {
    const q: [number, number][] = [[startRow, startCol]];
    const visited = new Set<number>();
    visited.add(startRow * cols + startCol);

    let qi = 0;
    while (qi < q.length) {
      const entry = q[qi++];
      if (!entry) {
        break;
      }
      const [r, c] = entry;
      const cell = board[r]?.[c];
      if (!cell || cell.hasMine) {
        continue;
      }
      if (solverFlagged[r]?.[c]) {
        continue;
      }
      const revRow = revealed[r];
      if (revRow !== undefined) {
        revRow[c] = true;
      }

      if (cell.value === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) {
              continue;
            }
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
              continue;
            }
            const key = nr * cols + nc;
            if (visited.has(key)) {
              continue;
            }
            const neighbor = board[nr]?.[nc];
            if (!neighbor || neighbor.hasMine) {
              continue;
            }
            if (revealed[nr]?.[nc]) {
              continue;
            }
            visited.add(key);
            q.push([nr, nc]);
          }
        }
      }
    }
  };

  floodReveal(firstClick[0], firstClick[1]);

  // Constraint propagation loop
  let progress = true;
  while (progress) {
    progress = false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!revealed[r]?.[c]) {
          continue;
        }
        const cell = board[r]?.[c];
        if (!cell || cell.hasMine || cell.value === 0) {
          continue;
        }

        // Gather neighbors
        const neighbors: [number, number][] = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) {
              continue;
            }
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              neighbors.push([nr, nc]);
            }
          }
        }

        const unrevealedNonFlagged = neighbors.filter(
          ([nr, nc]) => !revealed[nr]?.[nc] && !solverFlagged[nr]?.[nc]
        );
        const flaggedCount = neighbors.filter(([nr, nc]) => solverFlagged[nr]?.[nc]).length;

        // Rule 1: value == unrevealed + flagged → all unrevealed are mines
        if (cell.value === unrevealedNonFlagged.length + flaggedCount) {
          for (const [nr, nc] of unrevealedNonFlagged) {
            const sfRow = solverFlagged[nr];
            if (sfRow !== undefined && !sfRow[nc]) {
              sfRow[nc] = true;
              progress = true;
            }
          }
        }

        // Rule 2: value == flagged → all remaining unrevealed are safe
        if (cell.value === flaggedCount) {
          for (const [nr, nc] of unrevealedNonFlagged) {
            if (!revealed[nr]?.[nc]) {
              floodReveal(nr, nc);
              progress = true;
            }
          }
        }
      }
    }
  }

  // Check all safe cells are revealed
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r]?.[c];
      if (!cell || cell.hasMine) {
        continue;
      }
      if (!revealed[r]?.[c]) {
        return false;
      }
    }
  }
  return true;
}
