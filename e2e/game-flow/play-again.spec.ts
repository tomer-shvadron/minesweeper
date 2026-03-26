import { test, expect } from '../fixtures'

test.describe('Play Again & Change Level', () => {
  test('Play Again resets game without modal (same difficulty)', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
    await gamePage.loseGame()
    await gamePage.gameOverBanner.waitFor()
    await gamePage.page.getByRole('button', { name: 'Play Again' }).click()
    // Modal should NOT appear
    await expect(gamePage.newGameModal()).not.toBeVisible()
    // Timer should reset
    await expect(gamePage.timer).toContainText('0')
    // Banner gone
    await expect(gamePage.gameOverBanner).not.toBeVisible()
    // Smiley resets
    await expect(gamePage.smiley).toContainText('🙂')
    // Same cell count
    const cells = gamePage.page.getByRole('button', { name: /^Cell \d+,\d+$/ })
    await expect(cells).toHaveCount(81)
  })

  test('Play Again after win resets to same difficulty', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
    await gamePage.winGame()
    // Dismiss high score prompt if shown
    const hsp = gamePage.highScorePrompt()
    if (await hsp.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gamePage.page.getByRole('button', { name: 'Skip' }).click()
    }
    await gamePage.gameOverBanner.waitFor()
    await gamePage.page.getByRole('button', { name: 'Play Again' }).click()
    const state = await gamePage.getGameState()
    expect(state.status).toBe('idle')
    expect(state.config.mines).toBe(10)
  })

  test('Change Level opens NewGameModal', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
    await gamePage.loseGame()
    await gamePage.gameOverBanner.waitFor()
    await gamePage.page.getByRole('button', { name: 'Change Level' }).click()
    await expect(gamePage.newGameModal()).toBeVisible()
  })

  test('Change Level → switch to Expert → new Expert game', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
    await gamePage.loseGame()
    await gamePage.gameOverBanner.waitFor()
    await gamePage.page.getByRole('button', { name: 'Change Level' }).click()
    await gamePage.page.getByLabel('Expert').check()
    await gamePage.page.getByRole('button', { name: 'Start' }).click()
    await expect(gamePage.newGameModal()).not.toBeVisible()
    const cells = gamePage.page.getByRole('button', { name: /^Cell \d+,\d+$/ })
    await expect(cells).toHaveCount(480)
  })

  test('mine counter resets to full count on Play Again', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
    await gamePage.firstClick(4, 4)
    // Flag some cells
    const state = await gamePage.getGameState()
    // Flag cells that are not revealed
    for (const r of [0, 1]) {
      const cell = state.board[r]?.[0]
      if (cell && !cell.isRevealed) {
        await gamePage.cell(r, 0).click({ button: 'right' })
      }
    }
    // Lose
    await gamePage.loseGame()
    await gamePage.gameOverBanner.waitFor()
    await gamePage.page.getByRole('button', { name: 'Play Again' }).click()
    await expect(gamePage.mineCounter).toContainText('10')
  })
})
