import { test, expect } from '../fixtures'

test.describe('Win game flow', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
  })

  test('winning shows 😎 You won! banner', async ({ gamePage }) => {
    await gamePage.winGame()
    const hsp = gamePage.highScorePrompt()
    if (await hsp.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gamePage.page.getByRole('button', { name: 'Skip' }).click()
    }
    await expect(gamePage.gameOverBanner).toContainText('😎 You won!')
  })

  test('winning changes smiley to 😎', async ({ gamePage }) => {
    await gamePage.winGame()
    // Dismiss high score prompt if shown — Radix sets aria-hidden on everything outside
    // the dialog, which makes getByRole unable to find the smiley button
    const hsp = gamePage.highScorePrompt()
    if (await hsp.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gamePage.page.getByRole('button', { name: 'Skip' }).click()
      await hsp.waitFor({ state: 'detached' })
    }
    await expect(gamePage.smiley).toContainText('😎')
  })

  test('winning sets game status to won', async ({ gamePage }) => {
    await gamePage.winGame()
    const state = await gamePage.getGameState()
    expect(state.status).toBe('won')
  })

  test('timer stops after win', async ({ gamePage }) => {
    await gamePage.winGame()
    const t1 = await gamePage.getGameState()
    await gamePage.page.waitForTimeout(1500)
    const t2 = await gamePage.getGameState()
    expect(t2.elapsedSeconds).toBe(t1.elapsedSeconds)
  })

  test('cells are non-interactive after win', async ({ gamePage }) => {
    await gamePage.winGame()
    // Dismiss high score prompt if shown — Radix aria-hidden blocks getByRole on cells
    const hsp = gamePage.highScorePrompt()
    if (await hsp.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gamePage.page.getByRole('button', { name: 'Skip' }).click()
      await hsp.waitFor({ state: 'detached' })
    }
    await gamePage.cell(0, 0).click({ force: true })
    const state = await gamePage.getGameState()
    expect(state.status).toBe('won')
  })

  test('high score prompt appears on first win (empty leaderboard)', async ({ gamePage }) => {
    await gamePage.winGame()
    await expect(gamePage.highScorePrompt()).toBeVisible({ timeout: 5000 })
  })

  test('no high score prompt when time is not a record', async ({ gamePage }) => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      name: `Player${i}`,
      timeSeconds: 1,
      date: new Date().toISOString(),
    }))
    await gamePage.setLeaderboardState({ entries: { beginner: entries } })

    await gamePage.firstClick(0, 0)
    await gamePage.setGameState({ elapsedSeconds: 9999 })
    await gamePage.winGameFromCurrentState()

    await gamePage.page.waitForTimeout(500)
    await expect(gamePage.highScorePrompt()).not.toBeVisible()
  })
})
