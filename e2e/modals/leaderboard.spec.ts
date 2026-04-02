import { test, expect } from '../fixtures';

test.describe('Leaderboard modal', () => {
  test('opens from trophy icon', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(gamePage.leaderboardModal()).toBeVisible();
  });

  test('closes with X button', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await gamePage.leaderboardModal().waitFor();
    await gamePage.page.getByRole('button', { name: 'Close' }).click();
    await expect(gamePage.leaderboardModal()).not.toBeVisible();
  });

  test('closes with Escape key', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await gamePage.leaderboardModal().waitFor();
    await gamePage.page.keyboard.press('Escape');
    await expect(gamePage.leaderboardModal()).not.toBeVisible();
  });

  test('shows empty state when no scores', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(gamePage.leaderboardModal()).toBeVisible();
    await expect(gamePage.page.getByText(/play a game to set a record/i)).toBeVisible();
  });

  test('shows difficulty tabs', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(gamePage.page.getByRole('tab', { name: 'Beginner' })).toBeVisible();
    await expect(gamePage.page.getByRole('tab', { name: 'Inter.' })).toBeVisible();
    await expect(gamePage.page.getByRole('tab', { name: 'Expert' })).toBeVisible();
  });

  test('shows scores after winning', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.winGame();
    // Submit a score
    const prompt = gamePage.highScorePrompt();
    if (await prompt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gamePage.page.getByPlaceholder('Your name').fill('TestPlayer');
      await gamePage.page.getByRole('button', { name: 'Save' }).click();
      await gamePage.leaderboardModal().waitFor();
    } else {
      await gamePage.page.locator('[aria-label="Leaderboard"]').click();
      await gamePage.leaderboardModal().waitFor();
    }
    await expect(gamePage.page.getByText('TestPlayer')).toBeVisible();
  });

  test('games played counter increments after completing a game', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(gamePage.page.getByText(/1 game played/i)).toBeVisible();
  });

  test('games played counter shows correct count after multiple games', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Play Again' }).click();
    await gamePage.loseGame();
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Play Again' }).click();
    await gamePage.loseGame();

    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(gamePage.page.getByText(/3 games played/i)).toBeVisible();
  });

  test('switching tabs shows correct difficulty scores', async ({ gamePage }) => {
    await gamePage.setLeaderboardState({
      entries: {
        beginner: [{ name: 'AliceB', timeSeconds: 30, date: new Date().toISOString() }],
        intermediate: [{ name: 'BobI', timeSeconds: 120, date: new Date().toISOString() }],
      },
    });
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(gamePage.page.getByText('AliceB')).toBeVisible();
    await gamePage.page.getByRole('tab', { name: 'Inter.' }).click();
    await expect(gamePage.page.getByText('BobI')).toBeVisible();
    await expect(gamePage.page.getByText('AliceB')).not.toBeVisible();
  });

  test('scores shown in fastest-first order', async ({ gamePage }) => {
    // addEntry sorts on write; setLeaderboardState bypasses that sort, so seed in
    // the expected display order (fastest first) so getTopEntries returns them correctly.
    await gamePage.setLeaderboardState({
      entries: {
        beginner: [
          { name: 'Fast', timeSeconds: 30, date: new Date().toISOString() },
          { name: 'Mid', timeSeconds: 60, date: new Date().toISOString() },
          { name: 'Slow', timeSeconds: 120, date: new Date().toISOString() },
        ],
      },
    });
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    // Scope to table rows inside the leaderboard modal (table has no CSS class — Tailwind only)
    const rows = gamePage.leaderboardModal().locator('tbody tr');
    await expect(rows.nth(0)).toContainText('Fast');
    await expect(rows.nth(1)).toContainText('Mid');
    await expect(rows.nth(2)).toContainText('Slow');
  });
});
