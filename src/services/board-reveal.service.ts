import { deepCopyBoard, getNeighborCoords } from '@/services/board-core.service';
import type { Board } from '@/types/game.types';

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
