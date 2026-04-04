import type { Board } from '@/types/game.types';

/**
 * Determines whether a board can be solved using only constraint propagation
 * (no guessing required). Simulates a player who:
 * 1. Reveals cells via flood-fill from the first click
 * 2. Flags cells when a number's unrevealed neighbours equal its value minus known flags
 * 3. Reveals cells when a number's flag count equals its value
 * 4. Repeats until no further progress can be made
 *
 * Returns true only if every safe cell is revealed through these rules alone.
 */
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
