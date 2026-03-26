import { test, expect } from '../fixtures'
import type { GamePage } from '../fixtures'

async function triggerHighScore(gamePage: GamePage) {
  await gamePage.startPreset('Beginner')
  await gamePage.winGame()
  await gamePage.highScorePrompt().waitFor({ timeout: 5000 })
}

test.describe('High Score Prompt', () => {
  test('appears on first win with empty leaderboard', async ({ gamePage }) => {
    await triggerHighScore(gamePage)
    await expect(gamePage.highScorePrompt()).toBeVisible()
  })

  test('input is empty when no previous name', async ({ gamePage }) => {
    await triggerHighScore(gamePage)
    const input = gamePage.page.getByPlaceholder('Your name')
    await expect(input).toHaveValue('')
  })

  test('input pre-filled with lastPlayerName', async ({ gamePage }) => {
    // The HighScorePrompt uses a lazy useState initializer that reads
    // useLeaderboardStore.getState().lastPlayerName at component MOUNT time.
    // setLeaderboardState() patches the store after mount, so the component
    // won't pick up the new value. Instead we seed localStorage and reload
    // so the store hydrates with the desired value before the component mounts.
    await gamePage.seedLeaderboardStorage({ lastPlayerName: 'Eve' })
    await triggerHighScore(gamePage)
    const input = gamePage.page.getByPlaceholder('Your name')
    await expect(input).toHaveValue('Eve')
  })

  test('submitting name saves to leaderboard', async ({ gamePage }) => {
    await triggerHighScore(gamePage)
    await gamePage.page.getByPlaceholder('Your name').fill('Frank')
    await gamePage.page.getByRole('button', { name: 'Save' }).click()
    await gamePage.leaderboardModal().waitFor()
    await expect(gamePage.highScorePrompt()).not.toBeVisible()
    await expect(gamePage.page.getByText('Frank')).toBeVisible()
  })

  test('submitting saves lastPlayerName for next prompt', async ({ gamePage }) => {
    await triggerHighScore(gamePage)
    await gamePage.page.getByPlaceholder('Your name').fill('Grace')
    await gamePage.page.getByRole('button', { name: 'Save' }).click()
    const lb = await gamePage.getLeaderboardState()
    expect(lb.lastPlayerName).toBe('Grace')
  })

  test('Skip dismisses prompt without saving', async ({ gamePage }) => {
    await triggerHighScore(gamePage)
    await gamePage.page.getByRole('button', { name: 'Skip' }).click()
    await expect(gamePage.highScorePrompt()).not.toBeVisible()
    const lb = await gamePage.getLeaderboardState()
    expect(Object.values(lb.entries).flat()).toHaveLength(0)
  })

  test('Escape dismisses prompt without saving', async ({ gamePage }) => {
    await triggerHighScore(gamePage)
    await gamePage.page.keyboard.press('Escape')
    await expect(gamePage.highScorePrompt()).not.toBeVisible()
  })

  test('Enter key submits the form', async ({ gamePage }) => {
    await triggerHighScore(gamePage)
    await gamePage.page.getByPlaceholder('Your name').fill('Henry')
    await gamePage.page.keyboard.press('Enter')
    await expect(gamePage.highScorePrompt()).not.toBeVisible()
    const lb = await gamePage.getLeaderboardState()
    const entries = Object.values(lb.entries).flat()
    expect(entries.some((e) => e.name === 'Henry')).toBe(true)
  })

  test('prompt does not appear when score does not rank', async ({ gamePage }) => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      name: `P${i}`,
      timeSeconds: 1,
      date: new Date().toISOString(),
    }))
    await gamePage.setLeaderboardState({ entries: { beginner: entries } })
    await gamePage.startPreset('Beginner')
    await gamePage.firstClick(0, 0)
    await gamePage.setGameState({ elapsedSeconds: 9999 })
    await gamePage.winGameFromCurrentState()
    await gamePage.page.waitForTimeout(500)
    await expect(gamePage.highScorePrompt()).not.toBeVisible()
  })
})
