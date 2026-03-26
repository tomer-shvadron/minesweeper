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
import type { Board, BoardConfig, CellState, CellValue } from '@/types/game.types'

function c(overrides: Partial<CellState> = {}): CellState {
  return {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    isQuestionMark: false,
    value: 0 as CellValue,
    isExploded: false,
    ...overrides,
  }
}

function makeBoard(rows: Partial<CellState>[][]): Board {
  return rows.map((row) => row.map((cell) => c(cell)))
}

const M = (): Partial<CellState> => ({ hasMine: true })
const F = (): Partial<CellState> => ({ isFlagged: true })
const Q = (): Partial<CellState> => ({ isQuestionMark: true })
const R = (v: CellValue = 0): Partial<CellState> => ({ isRevealed: true, value: v })
const N = (v: CellValue): Partial<CellState> => ({ value: v })

// -------------------------------------------------------------------
describe('createEmptyBoard', () => {
  it('creates a board with the correct number of rows and columns', () => {
    const board = createEmptyBoard({ rows: 3, cols: 5, mines: 1 })
    expect(board).toHaveLength(3)
    board.forEach((row) => expect(row).toHaveLength(5))
  })

  it('creates all cells in the default empty state', () => {
    createEmptyBoard({ rows: 2, cols: 2, mines: 1 })
      .flat()
      .forEach((cell) => {
        expect(cell.hasMine).toBe(false)
        expect(cell.isRevealed).toBe(false)
        expect(cell.isFlagged).toBe(false)
        expect(cell.isQuestionMark).toBe(false)
        expect(cell.value).toBe(0)
        expect(cell.isExploded).toBe(false)
      })
  })

  it('returns independent boards — mutating one does not affect another', () => {
    const b1 = createEmptyBoard({ rows: 2, cols: 2, mines: 0 })
    const b2 = createEmptyBoard({ rows: 2, cols: 2, mines: 0 })
    const b1Cell = b1[0]?.[0]
    if (b1Cell) {
      b1Cell.hasMine = true
    }
    expect(b2[0]?.[0]?.hasMine).toBe(false)
  })
})

// -------------------------------------------------------------------
describe('createBoardKey', () => {
  it('maps beginner config to "beginner"', () => {
    expect(createBoardKey({ rows: 9, cols: 9, mines: 10 })).toBe('beginner')
  })

  it('maps intermediate config to "intermediate"', () => {
    expect(createBoardKey({ rows: 16, cols: 16, mines: 40 })).toBe('intermediate')
  })

  it('maps expert config to "expert"', () => {
    expect(createBoardKey({ rows: 16, cols: 30, mines: 99 })).toBe('expert')
  })

  it('returns "colsxrowsxmines" for non-preset configs', () => {
    expect(createBoardKey({ rows: 10, cols: 20, mines: 30 })).toBe('20x10x30')
  })

  it('uses cols as the first dimension in the custom key', () => {
    expect(createBoardKey({ rows: 7, cols: 15, mines: 5 })).toBe('15x7x5')
  })

  it('treats a preset config with a different mine count as custom', () => {
    expect(createBoardKey({ rows: 9, cols: 9, mines: 11 })).toBe('9x9x11')
  })
})

// -------------------------------------------------------------------
describe('placeMines', () => {
  const config: BoardConfig = { rows: 9, cols: 9, mines: 10 }

  it('places exactly the configured number of mines', () => {
    const board = createEmptyBoard(config)
    const result = placeMines(board, config, 4, 4)
    expect(result.flat().filter((c) => c.hasMine)).toHaveLength(10)
  })

  it('never places a mine on the first-clicked cell (center)', () => {
    const board = createEmptyBoard(config)
    for (let i = 0; i < 30; i++) {
      expect(placeMines(board, config, 4, 4)[4]?.[4]?.hasMine).toBe(false)
    }
  })

  it('never places mines on the 8 neighbors of the first click', () => {
    const board = createEmptyBoard(config)
    const safeZone: [number, number][] = [
      [3, 3],
      [3, 4],
      [3, 5],
      [4, 3],
      [4, 4],
      [4, 5],
      [5, 3],
      [5, 4],
      [5, 5],
    ]
    for (let i = 0; i < 20; i++) {
      const result = placeMines(board, config, 4, 4)
      for (const [r, col] of safeZone) {
        expect(result[r]?.[col]?.hasMine).toBe(false)
      }
    }
  })

  it('never places a mine on a corner first click or its 3 neighbors', () => {
    const board = createEmptyBoard(config)
    for (let i = 0; i < 20; i++) {
      const result = placeMines(board, config, 0, 0)
      expect(result[0]?.[0]?.hasMine).toBe(false)
      expect(result[0]?.[1]?.hasMine).toBe(false)
      expect(result[1]?.[0]?.hasMine).toBe(false)
      expect(result[1]?.[1]?.hasMine).toBe(false)
    }
  })

  it('never places a mine on an edge first click or its 5 neighbors', () => {
    const board = createEmptyBoard(config)
    for (let i = 0; i < 20; i++) {
      const result = placeMines(board, config, 0, 4)
      for (const [r, col] of [
        [0, 3],
        [0, 4],
        [0, 5],
        [1, 3],
        [1, 4],
        [1, 5],
      ] as [number, number][]) {
        expect(result[r]?.[col]?.hasMine).toBe(false)
      }
    }
  })

  it('does not modify the original board', () => {
    const board = createEmptyBoard(config)
    placeMines(board, config, 4, 4)
    expect(board.flat().every((c) => !c.hasMine)).toBe(true)
  })

  it('places 0 mines when all cells are within the safe zone (tiny board)', () => {
    // 3x3 board, center click — all 9 cells are safe zone
    const tiny: BoardConfig = { rows: 3, cols: 3, mines: 10 }
    const board = createEmptyBoard(tiny)
    const result = placeMines(board, tiny, 1, 1)
    expect(result.flat().filter((c) => c.hasMine)).toHaveLength(0)
  })
})

// -------------------------------------------------------------------
describe('calculateAdjacentValues', () => {
  it('assigns 0 to all cells on a mine-free board', () => {
    const board = createEmptyBoard({ rows: 3, cols: 3, mines: 0 })
    calculateAdjacentValues(board)
      .flat()
      .forEach((cell) => expect(cell.value).toBe(0))
  })

  it('counts correctly for a single mine at a corner', () => {
    // M . .
    // . . .
    // . . .
    const board = makeBoard([
      [M(), {}, {}],
      [{}, {}, {}],
      [{}, {}, {}],
    ])
    const result = calculateAdjacentValues(board)
    expect(result[0]?.[1]?.value).toBe(1) // right of mine
    expect(result[1]?.[0]?.value).toBe(1) // below mine
    expect(result[1]?.[1]?.value).toBe(1) // diagonal
    expect(result[0]?.[2]?.value).toBe(0) // far right
    expect(result[2]?.[2]?.value).toBe(0) // far corner
  })

  it('assigns 8 to a cell surrounded by mines on all sides', () => {
    const board = makeBoard([
      [M(), M(), M()],
      [M(), {}, M()],
      [M(), M(), M()],
    ])
    expect(calculateAdjacentValues(board)[1]?.[1]?.value).toBe(8)
  })

  it('does not assign a non-zero value to mine cells themselves', () => {
    const board = makeBoard([
      [M(), {}, {}],
      [{}, {}, {}],
    ])
    expect(calculateAdjacentValues(board)[0]?.[0]?.value).toBe(0)
  })

  it('counts correctly when two mines are adjacent', () => {
    // M M .
    // . . .
    const board = makeBoard([
      [M(), M(), {}],
      [{}, {}, {}],
    ])
    const result = calculateAdjacentValues(board)
    expect(result[0]?.[2]?.value).toBe(1) // adjacent to right mine only
    expect(result[1]?.[0]?.value).toBe(2) // below both mines
    expect(result[1]?.[1]?.value).toBe(2) // below both mines
    expect(result[1]?.[2]?.value).toBe(1) // below right mine only
  })

  it('does not modify the original board', () => {
    const board = makeBoard([[M(), {}]])
    calculateAdjacentValues(board)
    expect(board[0]?.[1]?.value).toBe(0)
  })
})

// -------------------------------------------------------------------
describe('revealAllMines', () => {
  it('reveals all mine cells', () => {
    const board = makeBoard([
      [M(), {}],
      [{}, M()],
    ])
    const result = revealAllMines(board)
    expect(result[0]?.[0]?.isRevealed).toBe(true)
    expect(result[1]?.[1]?.isRevealed).toBe(true)
  })

  it('does not reveal non-mine cells', () => {
    const board = makeBoard([
      [M(), {}],
      [{}, M()],
    ])
    const result = revealAllMines(board)
    expect(result[0]?.[1]?.isRevealed).toBe(false)
    expect(result[1]?.[0]?.isRevealed).toBe(false)
  })

  it('does not set isExploded on any cell', () => {
    const board = makeBoard([[M(), M()]])
    revealAllMines(board)
      .flat()
      .forEach((cell) => expect(cell.isExploded).toBe(false))
  })

  it('does not modify the original board', () => {
    const board = makeBoard([[M(), {}]])
    revealAllMines(board)
    expect(board[0]?.[0]?.isRevealed).toBe(false)
  })
})

// -------------------------------------------------------------------
describe('floodFill', () => {
  it('reveals all connected empty (value=0) cells from the start', () => {
    const board = makeBoard([
      [{}, {}, {}],
      [{}, {}, {}],
      [{}, {}, {}],
    ])
    floodFill(board, 1, 1)
      .flat()
      .forEach((cell) => expect(cell.isRevealed).toBe(true))
  })

  it('reveals numbered boundary cells but does not propagate through them', () => {
    // 0 0 1 M
    // 0 0 1 M
    // 0 0 1 M
    const board = makeBoard([
      [{}, {}, N(1), M()],
      [{}, {}, N(1), M()],
      [{}, {}, N(1), M()],
    ])
    const result = floodFill(board, 1, 0)
    // All zero cells revealed
    expect(result[0]?.[0]?.isRevealed).toBe(true)
    expect(result[1]?.[1]?.isRevealed).toBe(true)
    expect(result[2]?.[0]?.isRevealed).toBe(true)
    // Numbered boundary cells revealed
    expect(result[0]?.[2]?.isRevealed).toBe(true)
    expect(result[1]?.[2]?.isRevealed).toBe(true)
    expect(result[2]?.[2]?.isRevealed).toBe(true)
    // Mines not revealed
    expect(result[0]?.[3]?.isRevealed).toBe(false)
    expect(result[1]?.[3]?.isRevealed).toBe(false)
    expect(result[2]?.[3]?.isRevealed).toBe(false)
  })

  it('does not reveal flagged neighbors', () => {
    const board = makeBoard([
      [{}, F()],
      [{}, {}],
    ])
    const result = floodFill(board, 0, 0)
    expect(result[0]?.[1]?.isRevealed).toBe(false)
    expect(result[0]?.[1]?.isFlagged).toBe(true)
  })

  it('does not reveal question-marked neighbors', () => {
    const board = makeBoard([
      [{}, Q()],
      [{}, {}],
    ])
    expect(floodFill(board, 0, 0)[0]?.[1]?.isRevealed).toBe(false)
  })

  it('does not reveal mine cells', () => {
    const board = makeBoard([
      [{}, M()],
      [{}, {}],
    ])
    expect(floodFill(board, 0, 0)[0]?.[1]?.isRevealed).toBe(false)
  })

  it('skips already-revealed cells without looping', () => {
    const board = makeBoard([
      [R(), {}],
      [{}, {}],
    ])
    expect(() => floodFill(board, 1, 1)).not.toThrow()
  })

  it('does not modify the original board', () => {
    const board = makeBoard([[{}, {}]])
    floodFill(board, 0, 0)
    expect(board[0]?.[0]?.isRevealed).toBe(false)
  })
})

// -------------------------------------------------------------------
describe('revealCell', () => {
  it('returns the same board reference for an already-revealed cell', () => {
    const board = makeBoard([[R(2)]])
    expect(revealCell(board, 0, 0)).toBe(board)
  })

  it('returns the same board reference for a flagged cell', () => {
    const board = makeBoard([[F()]])
    expect(revealCell(board, 0, 0)).toBe(board)
  })

  it('returns the same board reference for a question-marked cell', () => {
    const board = makeBoard([[Q()]])
    expect(revealCell(board, 0, 0)).toBe(board)
  })

  it('returns the same board reference for out-of-bounds coordinates', () => {
    const board = makeBoard([[{}]])
    expect(revealCell(board, 5, 5)).toBe(board)
    expect(revealCell(board, -1, 0)).toBe(board)
  })

  it('reveals only the target cell when its value is non-zero', () => {
    const board = makeBoard([
      [N(3), {}],
      [{}, {}],
    ])
    const result = revealCell(board, 0, 0)
    expect(result[0]?.[0]?.isRevealed).toBe(true)
    expect(result[0]?.[1]?.isRevealed).toBe(false)
    expect(result[1]?.[0]?.isRevealed).toBe(false)
  })

  it('flood-fills when the cell value is 0', () => {
    const board = makeBoard([
      [{}, {}],
      [{}, {}],
    ])
    revealCell(board, 0, 0)
      .flat()
      .forEach((cell) => expect(cell.isRevealed).toBe(true))
  })

  it('reveals a mine, marks it exploded, and reveals all other mines', () => {
    const board = makeBoard([
      [M(), {}],
      [{}, M()],
    ])
    const result = revealCell(board, 0, 0)
    expect(result[0]?.[0]?.isRevealed).toBe(true)
    expect(result[0]?.[0]?.isExploded).toBe(true)
    expect(result[1]?.[1]?.isRevealed).toBe(true)
    expect(result[1]?.[1]?.isExploded).toBe(false)
  })

  it('does not modify the original board', () => {
    const board = makeBoard([[N(1)]])
    revealCell(board, 0, 0)
    expect(board[0]?.[0]?.isRevealed).toBe(false)
  })
})

// -------------------------------------------------------------------
describe('chordReveal', () => {
  it('returns the board unchanged for an unrevealed cell', () => {
    const board = makeBoard([[N(1)]])
    expect(chordReveal(board, 0, 0)).toBe(board)
  })

  it('returns the board unchanged for a revealed zero-value cell', () => {
    const board = makeBoard([[R(0)]])
    expect(chordReveal(board, 0, 0)).toBe(board)
  })

  it('returns the board unchanged when flag count does not match cell value', () => {
    const board = makeBoard([
      [R(2), F()],
      [{}, {}],
    ])
    expect(chordReveal(board, 0, 0)).toBe(board)
  })

  it('reveals unflagged neighbors when flag count matches cell value', () => {
    // [0,0]=revealed(v=1), [0,1]=flagged mine, [1,0]=safe, [1,1]=safe
    const board = makeBoard([
      [R(1), { ...F(), ...M() }],
      [{}, {}],
    ])
    const result = chordReveal(board, 0, 0)
    expect(result[1]?.[0]?.isRevealed).toBe(true)
    expect(result[1]?.[1]?.isRevealed).toBe(true)
    expect(result[0]?.[1]?.isRevealed).toBe(false) // flagged cell not revealed
  })

  it('does not reveal already-revealed neighbors', () => {
    const board = makeBoard([
      [R(1), { ...F(), ...M() }],
      [R(1), R(0)],
    ])
    const result = chordReveal(board, 0, 0)
    // Neighbors [1,0] and [1,1] already revealed — nothing changes there
    expect(result[1]?.[0]?.isRevealed).toBe(true)
    expect(result[1]?.[1]?.isRevealed).toBe(true)
  })

  it('triggers a loss when a wrongly-flagged chord reveals a mine', () => {
    // [0,0]=flagged (wrong), [0,1]=mine (unflagged), [1,0]=revealed(v=1), [1,1]=safe
    const board = makeBoard([
      [F(), M()],
      [R(1), {}],
    ])
    const result = chordReveal(board, 1, 0)
    expect(result[0]?.[1]?.isRevealed).toBe(true)
    expect(result[0]?.[1]?.isExploded).toBe(true)
  })

  it('does not reveal question-marked neighbors', () => {
    const board = makeBoard([
      [R(1), { ...Q(), ...M() }],
      [{}, {}],
    ])
    // flag count = 0, value = 1 → no chord action (mismatch)
    expect(chordReveal(board, 0, 0)).toBe(board)
  })
})

// -------------------------------------------------------------------
describe('toggleFlag', () => {
  it('flags an unrevealed cell', () => {
    const board = makeBoard([[{}]])
    expect(toggleFlag(board, 0, 0, false)[0]?.[0]?.isFlagged).toBe(true)
  })

  it('unflags a flagged cell when question marks are disabled', () => {
    const board = makeBoard([[F()]])
    const result = toggleFlag(board, 0, 0, false)
    expect(result[0]?.[0]?.isFlagged).toBe(false)
    expect(result[0]?.[0]?.isQuestionMark).toBe(false)
  })

  it('converts flag → question mark when question marks are enabled', () => {
    const board = makeBoard([[F()]])
    const result = toggleFlag(board, 0, 0, true)
    expect(result[0]?.[0]?.isFlagged).toBe(false)
    expect(result[0]?.[0]?.isQuestionMark).toBe(true)
  })

  it('clears question mark back to unrevealed on the third toggle', () => {
    const board = makeBoard([[Q()]])
    const result = toggleFlag(board, 0, 0, true)
    expect(result[0]?.[0]?.isFlagged).toBe(false)
    expect(result[0]?.[0]?.isQuestionMark).toBe(false)
  })

  it('full cycle: unflagged → flag → question → unflagged', () => {
    const board = makeBoard([[{}]])
    const s1 = toggleFlag(board, 0, 0, true)
    expect(s1[0]?.[0]?.isFlagged).toBe(true)
    const s2 = toggleFlag(s1, 0, 0, true)
    expect(s2[0]?.[0]?.isQuestionMark).toBe(true)
    const s3 = toggleFlag(s2, 0, 0, true)
    expect(s3[0]?.[0]?.isFlagged).toBe(false)
    expect(s3[0]?.[0]?.isQuestionMark).toBe(false)
  })

  it('full cycle without question marks: unflagged → flag → unflagged', () => {
    const board = makeBoard([[{}]])
    const s1 = toggleFlag(board, 0, 0, false)
    expect(s1[0]?.[0]?.isFlagged).toBe(true)
    const s2 = toggleFlag(s1, 0, 0, false)
    expect(s2[0]?.[0]?.isFlagged).toBe(false)
    expect(s2[0]?.[0]?.isQuestionMark).toBe(false)
  })

  it('does not modify a revealed cell', () => {
    const board = makeBoard([[R(1)]])
    expect(toggleFlag(board, 0, 0, false)).toBe(board)
  })

  it('returns the board unchanged for out-of-bounds coordinates', () => {
    const board = makeBoard([[{}]])
    expect(toggleFlag(board, 5, 5, false)).toBe(board)
  })

  it('does not modify the original board', () => {
    const board = makeBoard([[{}]])
    toggleFlag(board, 0, 0, false)
    expect(board[0]?.[0]?.isFlagged).toBe(false)
  })
})

// -------------------------------------------------------------------
describe('checkWin', () => {
  it('returns true when all non-mine cells are revealed', () => {
    const board = makeBoard([
      [R(1), M()],
      [R(1), R(1)],
    ])
    expect(checkWin(board)).toBe(true)
  })

  it('returns false when any non-mine cell is unrevealed', () => {
    const board = makeBoard([
      [R(1), M()],
      [{}, R(1)],
    ])
    expect(checkWin(board)).toBe(false)
  })

  it('returns true even when mines are not revealed', () => {
    const board = makeBoard([[R(1), M()]])
    expect(checkWin(board)).toBe(true)
  })

  it('returns false for a fresh all-empty board', () => {
    expect(checkWin(createEmptyBoard({ rows: 3, cols: 3, mines: 0 }))).toBe(false)
  })

  it('returns true for a board with only mines (edge case)', () => {
    const board = makeBoard([[M(), M()]])
    expect(checkWin(board)).toBe(true)
  })
})

// -------------------------------------------------------------------
describe('checkLoss', () => {
  it('returns false when no mines are revealed', () => {
    const board = makeBoard([
      [M(), {}],
      [{}, M()],
    ])
    expect(checkLoss(board)).toBe(false)
  })

  it('returns true when a mine is revealed', () => {
    const board = makeBoard([
      [{ ...M(), isRevealed: true }, {}],
      [{}, M()],
    ])
    expect(checkLoss(board)).toBe(true)
  })

  it('returns false for a fully revealed board with no mines', () => {
    const board = makeBoard([[R(0), R(1)]])
    expect(checkLoss(board)).toBe(false)
  })

  it('returns false for a fresh board', () => {
    expect(checkLoss(createEmptyBoard({ rows: 3, cols: 3, mines: 5 }))).toBe(false)
  })
})

// -------------------------------------------------------------------
describe('countRemainingFlags', () => {
  it('returns totalMines when no flags are placed', () => {
    const board = makeBoard([[M(), {}]])
    expect(countRemainingFlags(board, 2)).toBe(2)
  })

  it('decrements by one for each flagged cell', () => {
    const board = makeBoard([
      [F(), {}],
      [{}, M()],
    ])
    expect(countRemainingFlags(board, 2)).toBe(1)
  })

  it('can go negative when more flags than mines (over-flagging)', () => {
    const board = makeBoard([[F(), F(), F()]])
    expect(countRemainingFlags(board, 1)).toBe(-2)
  })

  it('does not count question marks as flags', () => {
    const board = makeBoard([[Q(), Q(), M()]])
    expect(countRemainingFlags(board, 1)).toBe(1)
  })

  it('returns 0 when flags exactly match mines', () => {
    const board = makeBoard([[F(), F(), M(), M()]])
    expect(countRemainingFlags(board, 2)).toBe(0)
  })

  it('does not count revealed cells (they cannot be flagged)', () => {
    const board = makeBoard([[R(1), F(), M()]])
    expect(countRemainingFlags(board, 1)).toBe(0)
  })
})
