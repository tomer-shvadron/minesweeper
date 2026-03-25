import { describe, expect, it } from 'vitest'

import {
  calculateAdjacentValues,
  checkLoss,
  checkWin,
  chordReveal,
  countRemainingFlags,
  createBoardKey,
  createEmptyBoard,
  floodFill,
  placeMines,
  revealAllMines,
  revealCell,
  toggleFlag,
} from '@/services/board.service'
import type { Board, BoardConfig, CellState } from '@/types/game.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from(
      { length: cols },
      (): CellState => ({
        hasMine: false,
        isRevealed: false,
        isFlagged: false,
        isQuestionMark: false,
        value: 0,
        isExploded: false,
      })
    )
  )
}

function setMine(board: Board, row: number, col: number): Board {
  return board.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? { ...c, hasMine: true } : c))
  )
}

function setRevealed(board: Board, row: number, col: number): Board {
  return board.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? { ...c, isRevealed: true } : c))
  )
}

function setFlagged(board: Board, row: number, col: number): Board {
  return board.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? { ...c, isFlagged: true } : c))
  )
}

function setQuestionMark(board: Board, row: number, col: number): Board {
  return board.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? { ...c, isQuestionMark: true } : c))
  )
}

function getCell(board: Board, row: number, col: number): CellState {
  const cell = board[row]?.[col]
  if (!cell) throw new Error(`Cell [${row}][${col}] out of bounds`)
  return cell
}

function countMines(board: Board): number {
  return board.flat().filter((c) => c.hasMine).length
}

function countRevealed(board: Board): number {
  return board.flat().filter((c) => c.isRevealed).length
}

// ---------------------------------------------------------------------------
// createEmptyBoard
// ---------------------------------------------------------------------------

describe('createEmptyBoard', () => {
  it('creates a board with correct number of rows and cols', () => {
    const board = createEmptyBoard({ rows: 9, cols: 9, mines: 10 })
    expect(board.length).toBe(9)
    expect(board[0]?.length ?? 0).toBe(9)
  })

  it('creates a board with correct dimensions for non-square boards', () => {
    const board = createEmptyBoard({ rows: 16, cols: 30, mines: 99 })
    expect(board.length).toBe(16)
    expect(board[0]?.length ?? 0).toBe(30)
  })

  it('creates a 1x1 board', () => {
    const board = createEmptyBoard({ rows: 1, cols: 1, mines: 0 })
    expect(board.length).toBe(1)
    expect(board[0]?.length ?? 0).toBe(1)
  })

  it('all cells are unrevealed', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 5 })
    expect(board.flat().every((c) => !c.isRevealed)).toBe(true)
  })

  it('all cells have no mines', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 5 })
    expect(board.flat().every((c) => !c.hasMine)).toBe(true)
  })

  it('all cells are unflagged', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 5 })
    expect(board.flat().every((c) => !c.isFlagged)).toBe(true)
  })

  it('all cells have no question marks', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 5 })
    expect(board.flat().every((c) => !c.isQuestionMark)).toBe(true)
  })

  it('all cells have value 0', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 5 })
    expect(board.flat().every((c) => c.value === 0)).toBe(true)
  })

  it('all cells are not exploded', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 5 })
    expect(board.flat().every((c) => !c.isExploded)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createBoardKey
// ---------------------------------------------------------------------------

describe('createBoardKey', () => {
  it('returns "beginner" for 9x9 with 10 mines', () => {
    expect(createBoardKey({ rows: 9, cols: 9, mines: 10 })).toBe('beginner')
  })

  it('returns "intermediate" for 16x16 with 40 mines', () => {
    expect(createBoardKey({ rows: 16, cols: 16, mines: 40 })).toBe('intermediate')
  })

  it('returns "expert" for 16x30 with 99 mines', () => {
    expect(createBoardKey({ rows: 16, cols: 30, mines: 99 })).toBe('expert')
  })

  it('returns custom key for non-preset config', () => {
    expect(createBoardKey({ rows: 10, cols: 15, mines: 20 })).toBe('15x10x20')
  })

  it('custom key format is colsxrowsxmines', () => {
    const key = createBoardKey({ rows: 8, cols: 12, mines: 15 })
    expect(key).toBe('12x8x15')
  })

  it('returns custom key if only one dimension differs from preset', () => {
    // beginner is 9x9 10 mines — change mines
    expect(createBoardKey({ rows: 9, cols: 9, mines: 11 })).toBe('9x9x11')
  })
})

// ---------------------------------------------------------------------------
// placeMines
// ---------------------------------------------------------------------------

describe('placeMines', () => {
  const config: BoardConfig = { rows: 9, cols: 9, mines: 10 }

  it('places the correct number of mines', () => {
    const empty = createEmptyBoard(config)
    const board = placeMines(empty, config, 4, 4)
    expect(countMines(board)).toBe(10)
  })

  it('the safe cell itself has no mine', () => {
    const empty = createEmptyBoard(config)
    const board = placeMines(empty, config, 4, 4)
    expect(getCell(board, 4, 4).hasMine).toBe(false)
  })

  it('all 8 neighbors of safe cell have no mines', () => {
    const empty = createEmptyBoard(config)
    const board = placeMines(empty, config, 4, 4)
    const neighbors = [
      [3, 3],
      [3, 4],
      [3, 5],
      [4, 3],
      [4, 5],
      [5, 3],
      [5, 4],
      [5, 5],
    ] as const
    for (const [r, c] of neighbors) {
      expect(getCell(board, r, c).hasMine).toBe(false)
    }
  })

  it('safe cell in corner — only valid neighbors are safe', () => {
    const empty = createEmptyBoard(config)
    const board = placeMines(empty, config, 0, 0)
    // (0,0) and its neighbors: (0,1), (1,0), (1,1)
    expect(getCell(board, 0, 0).hasMine).toBe(false)
    expect(getCell(board, 0, 1).hasMine).toBe(false)
    expect(getCell(board, 1, 0).hasMine).toBe(false)
    expect(getCell(board, 1, 1).hasMine).toBe(false)
  })

  it('no duplicate mines — mine count equals config.mines', () => {
    const empty = createEmptyBoard(config)
    // Run multiple times to catch randomness issues
    for (let i = 0; i < 20; i++) {
      const board = placeMines(empty, config, 0, 0)
      expect(countMines(board)).toBe(10)
    }
  })

  it('does not mutate the original board', () => {
    const empty = createEmptyBoard(config)
    placeMines(empty, config, 4, 4)
    expect(countMines(empty)).toBe(0)
  })

  it('handles large mine counts (expert)', () => {
    const expertConfig: BoardConfig = { rows: 16, cols: 30, mines: 99 }
    const empty = createEmptyBoard(expertConfig)
    const board = placeMines(empty, expertConfig, 0, 0)
    expect(countMines(board)).toBe(99)
  })

  it('safe cell at edge has correct neighbor safety', () => {
    const empty = createEmptyBoard(config)
    const board = placeMines(empty, config, 0, 4)
    // safe zone: (0,4), and neighbors that are in bounds: (0,3),(0,5),(1,3),(1,4),(1,5)
    expect(getCell(board, 0, 4).hasMine).toBe(false)
    expect(getCell(board, 0, 3).hasMine).toBe(false)
    expect(getCell(board, 0, 5).hasMine).toBe(false)
    expect(getCell(board, 1, 3).hasMine).toBe(false)
    expect(getCell(board, 1, 4).hasMine).toBe(false)
    expect(getCell(board, 1, 5).hasMine).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// calculateAdjacentValues
// ---------------------------------------------------------------------------

describe('calculateAdjacentValues', () => {
  it('a cell adjacent to 1 mine has value 1', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    const result = calculateAdjacentValues(board)
    // (0,1) is adjacent to (0,0)
    expect(getCell(result, 0, 1).value).toBe(1)
  })

  it('a mine cell retains value 0', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 1, 1)
    const result = calculateAdjacentValues(board)
    expect(getCell(result, 1, 1).value).toBe(0)
  })

  it('center cell surrounded by 8 mines has value 8', () => {
    let board = makeBoard(3, 3)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!(r === 1 && c === 1)) board = setMine(board, r, c)
      }
    }
    const result = calculateAdjacentValues(board)
    expect(getCell(result, 1, 1).value).toBe(8)
  })

  it('a cell with no adjacent mines has value 0', () => {
    let board = makeBoard(5, 5)
    board = setMine(board, 0, 0)
    const result = calculateAdjacentValues(board)
    // (4,4) is far from (0,0)
    expect(getCell(result, 4, 4).value).toBe(0)
  })

  it('correctly counts mines for corner cells', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 1)
    board = setMine(board, 1, 0)
    board = setMine(board, 1, 1)
    const result = calculateAdjacentValues(board)
    // (0,0) is adjacent to (0,1), (1,0), (1,1)
    expect(getCell(result, 0, 0).value).toBe(3)
  })

  it('does not mutate original board', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    calculateAdjacentValues(board)
    expect(getCell(board, 0, 1).value).toBe(0) // original unchanged
  })

  it('handles a 1x1 board with no mines', () => {
    const board = makeBoard(1, 1)
    const result = calculateAdjacentValues(board)
    expect(getCell(result, 0, 0).value).toBe(0)
  })

  it('correctly handles a row of mines', () => {
    // 3x3 board with all mines in top row
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = setMine(board, 0, 1)
    board = setMine(board, 0, 2)
    const result = calculateAdjacentValues(board)
    // (1,0) is adjacent to (0,0) and (0,1) → value 2
    expect(getCell(result, 1, 0).value).toBe(2)
    // (1,1) is adjacent to (0,0), (0,1), (0,2) → value 3
    expect(getCell(result, 1, 1).value).toBe(3)
    // (1,2) is adjacent to (0,1) and (0,2) → value 2
    expect(getCell(result, 1, 2).value).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// revealAllMines
// ---------------------------------------------------------------------------

describe('revealAllMines', () => {
  it('reveals all mines', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = setMine(board, 2, 2)
    const result = revealAllMines(board)
    expect(getCell(result, 0, 0).isRevealed).toBe(true)
    expect(getCell(result, 2, 2).isRevealed).toBe(true)
  })

  it('does not reveal non-mine cells', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    const result = revealAllMines(board)
    expect(getCell(result, 1, 1).isRevealed).toBe(false)
  })

  it('does not mutate original board', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    revealAllMines(board)
    expect(getCell(board, 0, 0).isRevealed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// revealCell
// ---------------------------------------------------------------------------

describe('revealCell', () => {
  it('does nothing on a flagged cell', () => {
    let board = makeBoard(3, 3)
    board = setFlagged(board, 1, 1)
    const result = revealCell(board, 1, 1)
    expect(getCell(result, 1, 1).isRevealed).toBe(false)
  })

  it('does nothing on a question-mark cell', () => {
    let board = makeBoard(3, 3)
    board = setQuestionMark(board, 1, 1)
    const result = revealCell(board, 1, 1)
    expect(getCell(result, 1, 1).isRevealed).toBe(false)
  })

  it('does nothing on an already-revealed cell', () => {
    let board = makeBoard(3, 3)
    board = setRevealed(board, 1, 1)
    const result = revealCell(board, 1, 1)
    // Should be a no-op (returns same board reference or equal board)
    expect(getCell(result, 1, 1).isRevealed).toBe(true)
    expect(result).toBe(board) // strict no-op
  })

  it('reveals a mine cell and marks it as exploded', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 1, 1)
    const result = revealCell(board, 1, 1)
    expect(getCell(result, 1, 1).isRevealed).toBe(true)
    expect(getCell(result, 1, 1).isExploded).toBe(true)
  })

  it('reveals all mines when a mine is clicked', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = setMine(board, 1, 1)
    board = setMine(board, 2, 2)
    const result = revealCell(board, 0, 0)
    expect(getCell(result, 0, 0).isRevealed).toBe(true)
    expect(getCell(result, 1, 1).isRevealed).toBe(true)
    expect(getCell(result, 2, 2).isRevealed).toBe(true)
  })

  it('only the clicked mine is marked as exploded', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = setMine(board, 2, 2)
    const result = revealCell(board, 0, 0)
    expect(getCell(result, 0, 0).isExploded).toBe(true)
    expect(getCell(result, 2, 2).isExploded).toBe(false)
  })

  it('reveals a numbered cell (value > 0) without flood-fill', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    // (0,1) has value 1 (adjacent to mine at (0,0))
    const result = revealCell(board, 0, 1)
    expect(getCell(result, 0, 1).isRevealed).toBe(true)
    // (1,1) should NOT be revealed
    expect(getCell(result, 1, 1).isRevealed).toBe(false)
  })

  it('flood-fills on an empty cell (value === 0)', () => {
    // 5x5 board, mine at (0,0), click (4,4) — far from mine
    let board = makeBoard(5, 5)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    const result = revealCell(board, 4, 4)
    // (4,4) and many cells should be revealed
    expect(getCell(result, 4, 4).isRevealed).toBe(true)
    // cells near (0,0) should not all be revealed due to numbered border
    // but many empty cells should be revealed
    expect(countRevealed(result)).toBeGreaterThan(1)
  })

  it('does not mutate original board on mine reveal', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 1, 1)
    revealCell(board, 1, 1)
    expect(getCell(board, 1, 1).isRevealed).toBe(false)
  })

  it('does not mutate original board on numbered cell reveal', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    revealCell(board, 0, 1)
    expect(getCell(board, 0, 1).isRevealed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// floodFill
// ---------------------------------------------------------------------------

describe('floodFill', () => {
  it('reveals the starting cell', () => {
    const board = makeBoard(3, 3)
    const result = floodFill(board, 1, 1)
    expect(getCell(result, 1, 1).isRevealed).toBe(true)
  })

  it('reveals all cells on a board with no mines', () => {
    const board = makeBoard(3, 3)
    const result = floodFill(board, 0, 0)
    expect(board.flat().every((_c) => true)).toBe(true) // all 9 cells
    expect(result.flat().filter((c) => c.isRevealed).length).toBe(9)
  })

  it('stops at numbered cells (reveals them but does not continue)', () => {
    // 3x3 with mine at (0,0)
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    // Start flood-fill from (2,2)
    const result = floodFill(board, 2, 2)
    // (0,0) is a mine, should not be revealed
    expect(getCell(result, 0, 0).isRevealed).toBe(false)
  })

  it('does not reveal flagged cells', () => {
    let board = makeBoard(3, 3)
    board = setFlagged(board, 1, 1)
    const result = floodFill(board, 0, 0)
    expect(getCell(result, 1, 1).isRevealed).toBe(false)
  })

  it('does not reveal question-mark cells', () => {
    let board = makeBoard(3, 3)
    board = setQuestionMark(board, 1, 1)
    const result = floodFill(board, 0, 0)
    expect(getCell(result, 1, 1).isRevealed).toBe(false)
  })

  it('does not cross through mines', () => {
    // 3x3 board, top row all mines, click bottom-left
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = setMine(board, 0, 1)
    board = setMine(board, 0, 2)
    board = calculateAdjacentValues(board)
    const result = floodFill(board, 2, 2)
    expect(getCell(result, 0, 0).isRevealed).toBe(false)
    expect(getCell(result, 0, 1).isRevealed).toBe(false)
    expect(getCell(result, 0, 2).isRevealed).toBe(false)
  })

  it('does not mutate the original board', () => {
    const board = makeBoard(3, 3)
    floodFill(board, 0, 0)
    expect(getCell(board, 0, 0).isRevealed).toBe(false)
  })

  it('reveals numbered border cells adjacent to empty region', () => {
    // 5x5 board, mine at (0,0), flood from (4,4)
    let board = makeBoard(5, 5)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    const result = floodFill(board, 4, 4)
    // numbered cells like (0,1) and (1,0) and (1,1) should be revealed
    expect(getCell(result, 0, 1).isRevealed).toBe(true)
    expect(getCell(result, 1, 0).isRevealed).toBe(true)
    expect(getCell(result, 1, 1).isRevealed).toBe(true)
  })

  it('handles 1x1 board', () => {
    const board = makeBoard(1, 1)
    const result = floodFill(board, 0, 0)
    expect(getCell(result, 0, 0).isRevealed).toBe(true)
  })

  it('BFS visits all connected empty cells', () => {
    // L-shaped connectivity check
    // 3x3, mine at (2,2)
    let board = makeBoard(3, 3)
    board = setMine(board, 2, 2)
    board = calculateAdjacentValues(board)
    const result = floodFill(board, 0, 0)
    // Most cells should be revealed except (2,2) mine and its border
    expect(getCell(result, 0, 0).isRevealed).toBe(true)
    expect(getCell(result, 0, 1).isRevealed).toBe(true)
    expect(getCell(result, 0, 2).isRevealed).toBe(true)
    expect(getCell(result, 1, 0).isRevealed).toBe(true)
    // (2,2) mine should not be revealed
    expect(getCell(result, 2, 2).isRevealed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// chordReveal
// ---------------------------------------------------------------------------

describe('chordReveal', () => {
  it('does nothing if cell is not revealed', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    // (0,1) has value 1, flag (0,0)
    board = setFlagged(board, 0, 0)
    // do NOT reveal (0,1)
    const result = chordReveal(board, 0, 1)
    expect(result).toBe(board)
  })

  it('does nothing if flag count does not match cell value', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    board = setRevealed(board, 0, 1)
    // (0,1) has value 1 but no flags adjacent
    const result = chordReveal(board, 0, 1)
    expect(result).toBe(board)
  })

  it('does nothing if cell value is 0', () => {
    const board = makeBoard(3, 3)
    // No mines → all values 0
    const revealedBoard = setRevealed(board, 1, 1)
    const result = chordReveal(revealedBoard, 1, 1)
    expect(result).toBe(revealedBoard)
  })

  it('reveals non-flagged neighbors when flag count matches value', () => {
    // 3x3, mine at (0,0), reveal (0,1) with value 1, flag (0,0)
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    board = setRevealed(board, 0, 1)
    board = setFlagged(board, 0, 0)
    // (0,1).value === 1, adjacent flags === 1 → chord reveal
    const result = chordReveal(board, 0, 1)
    // Other non-mine, non-flagged, non-revealed neighbors of (0,1) should be revealed
    // Neighbors of (0,1): (0,0)[flagged], (1,0), (1,1), (0,2), (1,2)
    expect(getCell(result, 1, 0).isRevealed).toBe(true)
    expect(getCell(result, 1, 1).isRevealed).toBe(true)
  })

  it('flagged cells are not revealed by chord', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    board = setRevealed(board, 0, 1)
    board = setFlagged(board, 0, 0)
    const result = chordReveal(board, 0, 1)
    // (0,0) is flagged and should remain flagged, not revealed
    expect(getCell(result, 0, 0).isRevealed).toBe(false)
    expect(getCell(result, 0, 0).isFlagged).toBe(true)
  })

  it('triggers mine reveal if an unflagged mine neighbor is chordable', () => {
    // 3x3, two mines at (0,0) and (0,2), cell (0,1) has value 2
    // flag (0,0), chord (0,1) → will try to reveal (0,2) which is a mine
    // value at (0,1) = 2 (adjacent to (0,0) and (0,2) mines), flagCount = 1 → no chord
    // Let's also flag (1,0) as dummy so flag count reaches 2... but (1,0) is not a mine neighbor of (0,1)
    // Actually: neighbors of (0,1): (0,0)[mine,flagged], (0,2)[mine], (1,0), (1,1), (1,2)
    // value = 2, flags = 1 → no chord here. Let's set up properly.

    // Instead: mine at (0,0), reveal (1,1), flag (0,0), chord (1,1)
    // (1,1) value = 1 (adjacent to (0,0)), 1 flag → chord → try to reveal non-flagged, non-revealed neighbors
    // neighbors of (1,1): (0,0)[mine,flagged], (0,1), (0,2), (1,0), (1,2), (2,0), (2,1), (2,2)
    let board2 = makeBoard(3, 3)
    board2 = setMine(board2, 0, 0)
    board2 = calculateAdjacentValues(board2)
    board2 = setRevealed(board2, 1, 1)
    board2 = setFlagged(board2, 0, 0)
    // value at (1,1) = 1, flags = 1 → chord → reveals (0,1),(0,2),(1,0),(1,2),(2,0),(2,1),(2,2)
    const result2 = chordReveal(board2, 1, 1)
    // All non-mine non-flagged should be revealed
    expect(getCell(result2, 0, 1).isRevealed).toBe(true)
    expect(getCell(result2, 2, 2).isRevealed).toBe(true)
  })

  it('triggering mine through chord results in loss state', () => {
    // (0,1) has value 2, (0,0) and (0,2) are mines, only (0,0) is flagged
    // Chord (0,1) → flag count 1, value 2 → no chord
    // Setup where chord WILL hit a mine:
    // (1,1) value 2, mines at (0,0) and (2,2), flags: (0,0) and an incorrectly flagged safe cell
    // Simplest: value 1 cell, 1 flag on wrong cell, adjacent unflagged mine
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0) // real mine
    board = setMine(board, 0, 2) // real mine, won't be flagged
    board = calculateAdjacentValues(board)
    // (0,1) has value 2
    board = setRevealed(board, 0, 1)
    // flag a non-mine neighbor of (0,1) to fake flag count = 2
    board = setFlagged(board, 0, 0) // real mine, correct flag
    board = setFlagged(board, 1, 0) // non-mine, incorrect flag (value 2, now 2 flags)
    // Now chordReveal(0,1): value=2, flags=2 → chord → reveal (0,2)[mine!], (1,1), (1,2)
    const result = chordReveal(board, 0, 1)
    // (0,2) is a mine that gets revealed → checkLoss should be true
    expect(checkLoss(result)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// toggleFlag
// ---------------------------------------------------------------------------

describe('toggleFlag', () => {
  it('flags an unrevealed, unflagged, non-question-mark cell', () => {
    const board = makeBoard(3, 3)
    const result = toggleFlag(board, 1, 1, true)
    expect(getCell(result, 1, 1).isFlagged).toBe(true)
    expect(getCell(result, 1, 1).isQuestionMark).toBe(false)
  })

  it('with allowQuestionMarks=true: flagged → question mark', () => {
    let board = makeBoard(3, 3)
    board = setFlagged(board, 1, 1)
    const result = toggleFlag(board, 1, 1, true)
    expect(getCell(result, 1, 1).isFlagged).toBe(false)
    expect(getCell(result, 1, 1).isQuestionMark).toBe(true)
  })

  it('with allowQuestionMarks=false: flagged → unflagged', () => {
    let board = makeBoard(3, 3)
    board = setFlagged(board, 1, 1)
    const result = toggleFlag(board, 1, 1, false)
    expect(getCell(result, 1, 1).isFlagged).toBe(false)
    expect(getCell(result, 1, 1).isQuestionMark).toBe(false)
  })

  it('question mark → unflagged', () => {
    let board = makeBoard(3, 3)
    board = setQuestionMark(board, 1, 1)
    const result = toggleFlag(board, 1, 1, true)
    expect(getCell(result, 1, 1).isFlagged).toBe(false)
    expect(getCell(result, 1, 1).isQuestionMark).toBe(false)
  })

  it('question mark → unflagged when allowQuestionMarks=false', () => {
    let board = makeBoard(3, 3)
    board = setQuestionMark(board, 1, 1)
    const result = toggleFlag(board, 1, 1, false)
    expect(getCell(result, 1, 1).isFlagged).toBe(false)
    expect(getCell(result, 1, 1).isQuestionMark).toBe(false)
  })

  it('does nothing on a revealed cell', () => {
    let board = makeBoard(3, 3)
    board = setRevealed(board, 1, 1)
    const result = toggleFlag(board, 1, 1, true)
    expect(getCell(result, 1, 1).isFlagged).toBe(false)
    expect(result).toBe(board)
  })

  it('full cycle with allowQuestionMarks=true: unflagged → flag → question → unflagged', () => {
    const board = makeBoard(3, 3)
    const b1 = toggleFlag(board, 1, 1, true)
    expect(getCell(b1, 1, 1).isFlagged).toBe(true)

    const b2 = toggleFlag(b1, 1, 1, true)
    expect(getCell(b2, 1, 1).isFlagged).toBe(false)
    expect(getCell(b2, 1, 1).isQuestionMark).toBe(true)

    const b3 = toggleFlag(b2, 1, 1, true)
    expect(getCell(b3, 1, 1).isFlagged).toBe(false)
    expect(getCell(b3, 1, 1).isQuestionMark).toBe(false)
  })

  it('full cycle with allowQuestionMarks=false: unflagged → flag → unflagged', () => {
    const board = makeBoard(3, 3)
    const b1 = toggleFlag(board, 1, 1, false)
    expect(getCell(b1, 1, 1).isFlagged).toBe(true)

    const b2 = toggleFlag(b1, 1, 1, false)
    expect(getCell(b2, 1, 1).isFlagged).toBe(false)
    expect(getCell(b2, 1, 1).isQuestionMark).toBe(false)
  })

  it('does not mutate the original board', () => {
    const board = makeBoard(3, 3)
    toggleFlag(board, 1, 1, true)
    expect(getCell(board, 1, 1).isFlagged).toBe(false)
  })

  it('does not affect other cells', () => {
    const board = makeBoard(3, 3)
    const result = toggleFlag(board, 1, 1, true)
    // Other cells should be unchanged
    expect(getCell(result, 0, 0).isFlagged).toBe(false)
    expect(getCell(result, 2, 2).isFlagged).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// checkWin
// ---------------------------------------------------------------------------

describe('checkWin', () => {
  it('returns false when no cells are revealed', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    expect(checkWin(board)).toBe(false)
  })

  it('returns false when some non-mine cells are still hidden', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    // reveal only one non-mine cell
    board = setRevealed(board, 2, 2)
    expect(checkWin(board)).toBe(false)
  })

  it('returns true when all non-mine cells are revealed', () => {
    let board = makeBoard(2, 2)
    board = setMine(board, 0, 0)
    board = setRevealed(board, 0, 1)
    board = setRevealed(board, 1, 0)
    board = setRevealed(board, 1, 1)
    expect(checkWin(board)).toBe(true)
  })

  it('returns true for a 1x1 board with only a mine', () => {
    let board = makeBoard(1, 1)
    board = setMine(board, 0, 0)
    // No non-mine cells → trivially all non-mine cells are revealed
    expect(checkWin(board)).toBe(true)
  })

  it('returns false if non-mine cell is flagged but not revealed', () => {
    let board = makeBoard(2, 2)
    board = setMine(board, 0, 0)
    board = setRevealed(board, 0, 1)
    board = setRevealed(board, 1, 0)
    board = setFlagged(board, 1, 1) // flagged but not revealed
    expect(checkWin(board)).toBe(false)
  })

  it('returns false when board has no mines and no cells are revealed', () => {
    const board = makeBoard(3, 3)
    expect(checkWin(board)).toBe(false)
  })

  it('returns true when board has no mines and all cells are revealed', () => {
    let board = makeBoard(2, 2)
    board = setRevealed(board, 0, 0)
    board = setRevealed(board, 0, 1)
    board = setRevealed(board, 1, 0)
    board = setRevealed(board, 1, 1)
    expect(checkWin(board)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// checkLoss
// ---------------------------------------------------------------------------

describe('checkLoss', () => {
  it('returns false when no mines are revealed', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    expect(checkLoss(board)).toBe(false)
  })

  it('returns true when a mine is revealed', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = setRevealed(board, 0, 0)
    expect(checkLoss(board)).toBe(true)
  })

  it('returns false when non-mine cells are revealed', () => {
    let board = makeBoard(3, 3)
    board = setMine(board, 0, 0)
    board = setRevealed(board, 1, 1)
    board = setRevealed(board, 2, 2)
    expect(checkLoss(board)).toBe(false)
  })

  it('returns false on an empty board with no mines', () => {
    const board = makeBoard(3, 3)
    expect(checkLoss(board)).toBe(false)
  })

  it('returns true on a 1x1 board with a revealed mine', () => {
    let board = makeBoard(1, 1)
    board = setMine(board, 0, 0)
    board = setRevealed(board, 0, 0)
    expect(checkLoss(board)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// countRemainingFlags
// ---------------------------------------------------------------------------

describe('countRemainingFlags', () => {
  it('returns totalMines when no cells are flagged', () => {
    const board = makeBoard(3, 3)
    expect(countRemainingFlags(board, 10)).toBe(10)
  })

  it('returns totalMines - flagCount when some cells are flagged', () => {
    let board = makeBoard(3, 3)
    board = setFlagged(board, 0, 0)
    board = setFlagged(board, 1, 1)
    expect(countRemainingFlags(board, 10)).toBe(8)
  })

  it('returns 0 when flagCount equals totalMines', () => {
    let board = makeBoard(3, 3)
    board = setFlagged(board, 0, 0)
    board = setFlagged(board, 1, 1)
    expect(countRemainingFlags(board, 2)).toBe(0)
  })

  it('can return negative values when over-flagged', () => {
    let board = makeBoard(3, 3)
    board = setFlagged(board, 0, 0)
    board = setFlagged(board, 1, 1)
    board = setFlagged(board, 2, 2)
    expect(countRemainingFlags(board, 2)).toBe(-1)
  })

  it('does not count question marks as flags', () => {
    let board = makeBoard(3, 3)
    board = setQuestionMark(board, 0, 0)
    expect(countRemainingFlags(board, 5)).toBe(5)
  })

  it('handles zero totalMines', () => {
    const board = makeBoard(3, 3)
    expect(countRemainingFlags(board, 0)).toBe(0)
  })

  it('handles board with no flags and zero mines', () => {
    const board = makeBoard(3, 3)
    expect(countRemainingFlags(board, 0)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Integration / Edge Cases
// ---------------------------------------------------------------------------

describe('Integration: full game scenario', () => {
  it('win condition after revealing all safe cells via flood fill', () => {
    // 3x3 board with mine at (0,0), click (2,2) → flood fill
    let board = createEmptyBoard({ rows: 3, cols: 3, mines: 1 })
    // Manually place mine
    board = setMine(board, 0, 0)
    board = calculateAdjacentValues(board)
    board = revealCell(board, 2, 2)
    expect(checkWin(board)).toBe(true)
    expect(checkLoss(board)).toBe(false)
  })

  it('loss condition after revealing a mine', () => {
    let board = createEmptyBoard({ rows: 3, cols: 3, mines: 1 })
    board = setMine(board, 1, 1)
    board = calculateAdjacentValues(board)
    board = revealCell(board, 1, 1)
    expect(checkLoss(board)).toBe(true)
    expect(checkWin(board)).toBe(false)
  })

  it('flag count decrements correctly across multiple flags', () => {
    let board = createEmptyBoard({ rows: 3, cols: 3, mines: 3 })
    board = toggleFlag(board, 0, 0, false)
    board = toggleFlag(board, 0, 1, false)
    expect(countRemainingFlags(board, 3)).toBe(1)
    board = toggleFlag(board, 0, 0, false) // unflag
    expect(countRemainingFlags(board, 3)).toBe(2)
  })
})
