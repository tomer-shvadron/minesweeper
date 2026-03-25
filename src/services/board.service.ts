import { DIFFICULTY_PRESETS } from '@/constants/game.constants'
import type { Board, BoardConfig, BoardKey, CellState, CellValue } from '@/types/game.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmptyCell(): CellState {
  return {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    isQuestionMark: false,
    value: 0,
    isExploded: false,
  }
}

function getNeighborCoords(board: Board, row: number, col: number): [number, number][] {
  const neighbors: [number, number][] = []
  const rows = board.length
  const cols = board[0]?.length ?? 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        neighbors.push([r, c])
      }
    }
  }
  return neighbors
}

function deepCopyBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a board of all-empty, unrevealed, unflagged cells.
 */
export function createEmptyBoard(config: BoardConfig): Board {
  return Array.from({ length: config.rows }, () =>
    Array.from({ length: config.cols }, () => createEmptyCell())
  )
}

/**
 * Returns 'beginner', 'intermediate', 'expert', or '${cols}x${rows}x${mines}' for custom.
 */
export function createBoardKey(config: BoardConfig): BoardKey {
  for (const [key, preset] of Object.entries(DIFFICULTY_PRESETS)) {
    if (
      preset.rows === config.rows &&
      preset.cols === config.cols &&
      preset.mines === config.mines
    ) {
      return key as BoardKey
    }
  }
  return `${config.cols}x${config.rows}x${config.mines}`
}

/**
 * Places mines randomly, ensuring the clicked cell AND its 8 neighbors are always safe.
 * Returns a new board (immutable).
 */
export function placeMines(
  board: Board,
  config: BoardConfig,
  safeRow: number,
  safeCol: number
): Board {
  const newBoard = deepCopyBoard(board)
  const { rows, cols, mines } = config

  // Build set of safe cell indices (clicked cell + neighbors)
  const safeCells = new Set<number>()
  safeCells.add(safeRow * cols + safeCol)
  for (const [r, c] of getNeighborCoords(board, safeRow, safeCol)) {
    safeCells.add(r * cols + c)
  }

  // Build list of eligible positions
  const eligible: number[] = []
  for (let i = 0; i < rows * cols; i++) {
    if (!safeCells.has(i)) {
      eligible.push(i)
    }
  }

  // Fisher-Yates shuffle and take first `mines` elements
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = eligible[i]
    const b = eligible[j]
    if (a !== undefined && b !== undefined) {
      eligible[i] = b
      eligible[j] = a
    }
  }

  const minesToPlace = Math.min(mines, eligible.length)
  for (let i = 0; i < minesToPlace; i++) {
    const idx = eligible[i]
    if (idx === undefined) continue
    const r = Math.floor(idx / cols)
    const c = idx % cols
    const row = newBoard[r]
    if (row) {
      const cell = row[c]
      if (cell) {
        cell.hasMine = true
      }
    }
  }

  return newBoard
}

/**
 * After mine placement, calculates each non-mine cell's adjacent mine count (0–8).
 * Returns a new board (immutable).
 */
export function calculateAdjacentValues(board: Board): Board {
  const newBoard = deepCopyBoard(board)
  const rows = newBoard.length
  const cols = newBoard[0]?.length ?? 0

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = newBoard[r]?.[c]
      if (!cell || cell.hasMine) continue

      let count = 0
      for (const [nr, nc] of getNeighborCoords(board, r, c)) {
        if (board[nr]?.[nc]?.hasMine) count++
      }
      cell.value = count as CellValue
    }
  }

  return newBoard
}

/**
 * Reveals all mines on the board (called on loss). Flagged mines stay flagged.
 * Returns new board.
 */
export function revealAllMines(board: Board): Board {
  const newBoard = deepCopyBoard(board)
  for (const row of newBoard) {
    for (const cell of row) {
      if (cell.hasMine) {
        cell.isRevealed = true
      }
    }
  }
  return newBoard
}

/**
 * BFS flood-fill: reveal all connected cells that are not mines and not flagged.
 * Stops at numbered cells (reveals them but doesn't continue through them).
 * Returns a new board (immutable).
 */
export function floodFill(board: Board, row: number, col: number): Board {
  const newBoard = deepCopyBoard(board)
  const rows = newBoard.length
  const cols = newBoard[0]?.length ?? 0

  const queue: [number, number][] = [[row, col]]
  const visited = new Set<number>()
  visited.add(row * cols + col)

  while (queue.length > 0) {
    const entry = queue.shift()
    if (!entry) break
    const [r, c] = entry
    const cell = newBoard[r]?.[c]
    if (!cell) continue
    if (cell.hasMine || cell.isFlagged || cell.isQuestionMark) continue

    cell.isRevealed = true

    // Only continue BFS from empty cells (value === 0)
    if (cell.value === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
          const key = nr * cols + nc
          if (visited.has(key)) continue
          const neighbor = newBoard[nr]?.[nc]
          if (!neighbor) continue
          if (neighbor.hasMine || neighbor.isFlagged || neighbor.isQuestionMark) continue
          if (neighbor.isRevealed) continue
          visited.add(key)
          queue.push([nr, nc])
        }
      }
    }
  }

  return newBoard
}

/**
 * Reveals a single cell. Handles mine explosion, flood-fill for empty cells,
 * and no-op for flagged/question-mark/already-revealed cells.
 * Returns a new board (immutable).
 */
export function revealCell(board: Board, row: number, col: number): Board {
  const cell = board[row]?.[col]
  if (!cell) return board

  // No-op cases
  if (cell.isRevealed) return board
  if (cell.isFlagged || cell.isQuestionMark) return board

  if (cell.hasMine) {
    // Reveal all mines, mark this one as exploded
    const newBoard = revealAllMines(board)
    const explodedCell = newBoard[row]?.[col]
    if (explodedCell) {
      explodedCell.isExploded = true
    }
    return newBoard
  }

  if (cell.value === 0) {
    // Flood-fill
    return floodFill(board, row, col)
  }

  // Numbered cell — reveal just this one
  const newBoard = deepCopyBoard(board)
  const target = newBoard[row]?.[col]
  if (target) {
    target.isRevealed = true
  }
  return newBoard
}

/**
 * Chord reveal: if the revealed cell's value equals adjacent flag count,
 * reveal all non-flagged non-revealed neighbors.
 * Returns a new board (immutable).
 */
export function chordReveal(board: Board, row: number, col: number): Board {
  const cell = board[row]?.[col]
  if (!cell || !cell.isRevealed || cell.value === 0) return board

  const neighbors = getNeighborCoords(board, row, col)
  const flagCount = neighbors.filter(([r, c]) => board[r]?.[c]?.isFlagged).length

  if (flagCount !== cell.value) return board

  // Reveal all non-flagged, non-question-mark, non-revealed neighbors
  let newBoard = board
  for (const [r, c] of neighbors) {
    const neighbor = newBoard[r]?.[c]
    if (!neighbor) continue
    if (neighbor.isRevealed || neighbor.isFlagged || neighbor.isQuestionMark) continue
    newBoard = revealCell(newBoard, r, c)
  }

  return newBoard
}

/**
 * Toggles the flag/question-mark state of a cell.
 * Returns a new board (immutable).
 */
export function toggleFlag(
  board: Board,
  row: number,
  col: number,
  allowQuestionMarks: boolean
): Board {
  const cell = board[row]?.[col]
  if (!cell) return board
  if (cell.isRevealed) return board

  const newBoard = deepCopyBoard(board)
  const target = newBoard[row]?.[col]
  if (!target) return board

  if (!target.isFlagged && !target.isQuestionMark) {
    // Unflagged → flag
    target.isFlagged = true
  } else if (target.isFlagged) {
    target.isFlagged = false
    if (allowQuestionMarks) {
      // Flagged → question mark
      target.isQuestionMark = true
    }
    // else: flagged → unflagged (already set isFlagged = false above)
  } else if (target.isQuestionMark) {
    // Question mark → unflagged
    target.isQuestionMark = false
  }

  return newBoard
}

/**
 * Returns true if every non-mine cell is revealed.
 */
export function checkWin(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.hasMine && !cell.isRevealed) return false
    }
  }
  return true
}

/**
 * Returns true if any mine cell is revealed.
 */
export function checkLoss(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (cell.hasMine && cell.isRevealed) return true
    }
  }
  return false
}

/**
 * Returns totalMines minus the number of flagged cells (can go negative).
 */
export function countRemainingFlags(board: Board, totalMines: number): number {
  let flagged = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell.isFlagged) flagged++
    }
  }
  return totalMines - flagged
}
