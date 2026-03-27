// Uses persistenceTest fixture so localStorage is cleared ONCE at test start
// and page.reload() inside tests does NOT wipe the data.
import { persistenceTest as test, expect } from '../fixtures';

test.describe('localStorage persistence', () => {
  test('leaderboard entries survive page reload', async ({ gamePage, page }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.winGame();
    const prompt = gamePage.highScorePrompt();
    if (await prompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByPlaceholder('Your name').fill('IrisP');
      await page.getByRole('button', { name: 'Save' }).click();
    }
    await page.reload();
    const lb = await gamePage.getLeaderboardState();
    const allEntries = Object.values(lb.entries).flat();
    expect(allEntries.some((e) => e.name === 'IrisP')).toBe(true);
  });

  test('lastPlayerName persists across page reload', async ({ gamePage, page }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.winGame();
    const prompt = gamePage.highScorePrompt();
    if (await prompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByPlaceholder('Your name').fill('JackPR');
      await page.getByRole('button', { name: 'Save' }).click();
    }
    await page.reload();
    const lb = await gamePage.getLeaderboardState();
    expect(lb.lastPlayerName).toBe('JackPR');
  });

  test('gamesPlayed counter persists across reload', async ({ gamePage, page }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    await page.reload();
    const resume = page.getByRole('dialog', { name: 'Resume Game?' });
    if (await resume.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'New Game' }).click();
    }
    const lb = await gamePage.getLeaderboardState();
    expect(lb.gamesPlayed['beginner']).toBeGreaterThanOrEqual(1);
  });

  test('settings persist across page reload', async ({ gamePage, page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await gamePage.settingsModal().waitFor();
    const toggles = page.locator('[role="switch"]');
    const count = await toggles.count();
    const animToggle = toggles.nth(count - 1);
    const initialState = await animToggle.getAttribute('aria-checked');
    await animToggle.click();
    const toggledState = await animToggle.getAttribute('aria-checked');
    expect(toggledState).not.toBe(initialState);
    await page.keyboard.press('Escape');
    await page.reload();
    const resume = page.getByRole('dialog', { name: 'Resume Game?' });
    if (await resume.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'New Game' }).click();
    }
    await page.getByRole('button', { name: 'Settings' }).click();
    await gamePage.settingsModal().waitFor();
    const newToggles = page.locator('[role="switch"]');
    const newCount = await newToggles.count();
    const newAnimToggle = newToggles.nth(newCount - 1);
    const afterReloadState = await newAnimToggle.getAttribute('aria-checked');
    expect(afterReloadState).toBe(toggledState);
  });

  test('correct localStorage keys are present after a game', async ({ gamePage, page }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).toContain('minesweeper-leaderboard');
    expect(keys).toContain('minesweeper-game');
    // minesweeper-settings is only written when a setting is changed, not on initialization
  });
});
