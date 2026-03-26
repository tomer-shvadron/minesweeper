import { test, expect } from '../fixtures'

test.describe('Loss game flow', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
  })

  test('clicking a mine shows 💣 Game over banner', async ({ gamePage }) => {
    await gamePage.loseGame()
    await expect(gamePage.gameOverBanner).toContainText('💣 Game over')
  })

  test('losing changes smiley to 😵', async ({ gamePage }) => {
    await gamePage.loseGame()
    await expect(gamePage.smiley).toContainText('😵')
  })

  test('losing sets game status to lost', async ({ gamePage }) => {
    await gamePage.loseGame()
    const state = await gamePage.getGameState()
    expect(state.status).toBe('lost')
  })

  test('timer stops after loss', async ({ gamePage }) => {
    await gamePage.loseGame()
    const t1 = await gamePage.getGameState()
    await gamePage.page.waitForTimeout(1500)
    const t2 = await gamePage.getGameState()
    expect(t2.elapsedSeconds).toBe(t1.elapsedSeconds)
  })

  test('exploded mine cell is marked isExploded', async ({ gamePage }) => {
    await gamePage.firstClick(0, 0)
    const state = await gamePage.getGameState()
    const { board, config } = state
    let mineRow = -1,
      mineCol = -1
    for (let r = 0; r < config.rows && mineRow === -1; r++) {
      for (let c = 0; c < config.cols && mineRow === -1; c++) {
        if (board[r]?.[c]?.hasMine) {
          mineRow = r
          mineCol = c
        }
      }
    }
    await gamePage.cell(mineRow, mineCol).click()
    await gamePage.waitForStatus('lost')
    const postState = await gamePage.getGameState()
    const exploded = postState.board[mineRow]?.[mineCol]
    expect(exploded?.isExploded).toBe(true)
  })

  test('cells are non-interactive after loss', async ({ gamePage }) => {
    await gamePage.loseGame()
    await gamePage.cell(0, 0).click({ force: true })
    const state = await gamePage.getGameState()
    expect(state.status).toBe('lost')
  })

  test('no high score prompt on loss', async ({ gamePage }) => {
    await gamePage.loseGame()
    await expect(gamePage.highScorePrompt()).not.toBeVisible()
  })
})
