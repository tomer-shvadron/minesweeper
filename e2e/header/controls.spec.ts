import { test, expect } from '../fixtures';

test.describe('Header controls', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
  });

  test('smiley is 🙂 in idle state', async ({ gamePage }) => {
    await expect(gamePage.smiley).toContainText('🙂');
  });

  test('smiley becomes 😎 on win', async ({ gamePage }) => {
    await gamePage.winGame();
    // Dismiss high score prompt if shown — Radix aria-hidden blocks getByRole on smiley
    const hsp = gamePage.highScorePrompt();
    if (await hsp.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gamePage.page.getByRole('button', { name: 'Skip' }).click();
      await hsp.waitFor({ state: 'detached' });
    }
    await expect(gamePage.smiley).toContainText('😎');
  });

  test('smiley becomes 😵 on loss', async ({ gamePage }) => {
    await gamePage.loseGame();
    await expect(gamePage.smiley).toContainText('😵');
  });

  test('smiley click always opens NewGameModal', async ({ gamePage }) => {
    await gamePage.smiley.click();
    await expect(gamePage.newGameModal()).toBeVisible();
  });

  test('mine counter shows correct initial value', async ({ gamePage }) => {
    await expect(gamePage.mineCounter).toContainText('10');
  });

  test('mine counter decrements when a cell is flagged', async ({ gamePage }) => {
    await gamePage.firstClick(4, 4);
    // Use findUnrevealedSafeCell — flood fill from [4,4] may have already revealed [0,0]
    const [r, c] = await gamePage.findUnrevealedSafeCell();
    await gamePage.cell(r, c).click({ button: 'right' });
    await expect(gamePage.mineCounter).toContainText('9');
  });

  test('mine counter increments when flag is removed', async ({ gamePage }) => {
    await gamePage.firstClick(4, 4);
    const [r, c] = await gamePage.findUnrevealedSafeCell();
    await gamePage.cell(r, c).click({ button: 'right' });
    await gamePage.cell(r, c).click({ button: 'right' });
    await expect(gamePage.mineCounter).toContainText('10');
  });

  test('timer shows 0 before first click', async ({ gamePage }) => {
    const state = await gamePage.getGameState();
    expect(state.elapsedSeconds).toBe(0);
  });

  test('timer increments during play', async ({ gamePage }) => {
    await gamePage.cell(0, 0).click();
    await gamePage.page.waitForFunction(
      () => window.__MINESWEEPER_TEST__.getGameState().elapsedSeconds >= 1,
      { timeout: 5000 }
    );
    const state = await gamePage.getGameState();
    expect(state.elapsedSeconds).toBeGreaterThanOrEqual(1);
  });

  test('settings icon opens SettingsModal', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Settings' }).click();
    await expect(gamePage.settingsModal()).toBeVisible();
  });

  test('trophy icon opens LeaderboardModal', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(gamePage.leaderboardModal()).toBeVisible();
  });

  test('timer resets to 0 on new game', async ({ gamePage }) => {
    await gamePage.cell(0, 0).click();
    await gamePage.page.waitForFunction(
      () => window.__MINESWEEPER_TEST__.getGameState().elapsedSeconds >= 1,
      { timeout: 5000 }
    );
    await gamePage.smiley.click();
    await gamePage.page.getByRole('button', { name: 'Start' }).click();
    const state = await gamePage.getGameState();
    expect(state.elapsedSeconds).toBe(0);
  });
});
