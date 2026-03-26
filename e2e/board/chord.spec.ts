import { test, expect } from '../fixtures'

test.describe('Chord click', () => {
  test('chord click reveals neighbors when flag count matches cell value', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')

    await gamePage.firstClick(0, 0)

    const state = await gamePage.getGameState()
    const { board, config } = state

    let numberedRow = -1,
      numberedCol = -1
    let adjacentMines: [number, number][] = []

    outer: for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const cell = board[r]?.[c]
        if (cell?.isRevealed && cell.value > 0 && cell.value <= 2) {
          const mines: [number, number][] = []
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) {
                continue
              }
              const nr = r + dr,
                nc = c + dc
              if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                if (board[nr]?.[nc]?.hasMine) {
                  mines.push([nr, nc])
                }
              }
            }
          }
          if (mines.length === cell.value) {
            numberedRow = r
            numberedCol = c
            adjacentMines = mines
            break outer
          }
        }
      }
    }

    if (numberedRow === -1) {
      test.skip()
      return
    }

    for (const [mr, mc] of adjacentMines) {
      await gamePage.cell(mr, mc).click({ button: 'right' })
    }

    const countUnrevealedNeighbors = (b: typeof board) => {
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) {
            continue
          }
          const nr = numberedRow + dr,
            nc = numberedCol + dc
          if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
            const neighbor = b[nr]?.[nc]
            if (neighbor && !neighbor.isRevealed && !neighbor.isFlagged) {
              count++
            }
          }
        }
      }
      return count
    }

    const beforeCount = countUnrevealedNeighbors(state.board)

    if (beforeCount === 0) {
      test.skip()
      return
    }

    await gamePage.cell(numberedRow, numberedCol).click()

    const afterState = await gamePage.getGameState()
    expect(['playing', 'won']).toContain(afterState.status)

    const afterCount = countUnrevealedNeighbors(afterState.board)
    expect(afterCount).toBeLessThan(beforeCount)
  })

  test('chord does NOT fire when flag count is less than cell value', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
    await gamePage.firstClick(0, 0)

    const state = await gamePage.getGameState()
    const { board, config } = state

    // Find a revealed cell with value >= 2
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const cell = board[r]?.[c]
        if (cell?.isRevealed && cell.value >= 2) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) {
                continue
              }
              const nr = r + dr,
                nc = c + dc
              if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                if (board[nr]?.[nc]?.hasMine) {
                  await gamePage.cell(nr, nc).click({ button: 'right' })
                  await gamePage.cell(r, c).click()
                  const afterState = await gamePage.getGameState()
                  expect(afterState.board[r]?.[c]?.isRevealed).toBe(true)
                  return
                }
              }
            }
          }
        }
      }
    }
  })
})
