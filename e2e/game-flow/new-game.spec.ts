import { test, expect } from '../fixtures';

test.describe('New Game flow', () => {
  test('fresh load: board is idle, no banner, smiley is 🙂', async ({ gamePage }) => {
    await expect(gamePage.smiley).toHaveText('🙂');
    await expect(gamePage.gameOverBanner).not.toBeVisible();
    const state = await gamePage.getGameState();
    expect(state.status).toBe('idle');
  });

  test('smiley click opens NewGameModal', async ({ gamePage }) => {
    await gamePage.smiley.click();
    await expect(gamePage.newGameModal()).toBeVisible();
  });

  test('beginner preset: 81 cells, 10 mines', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    const cells = gamePage.page.getByRole('button', { name: /^Cell \d+,\d+$/ });
    await expect(cells).toHaveCount(81);
    await expect(gamePage.mineCounter).toContainText('10');
  });

  test('intermediate preset: canvas board, 40 mines', async ({ gamePage }) => {
    // Intermediate (16×16 = 256 cells) exceeds CANVAS_THRESHOLD (250) → renders <canvas>
    await gamePage.startPreset('Intermediate');
    await expect(gamePage.board.locator('canvas')).toBeVisible();
    await expect(gamePage.page.getByRole('button', { name: /^Cell / })).toHaveCount(0);
    await expect(gamePage.mineCounter).toContainText('40');
  });

  test('expert preset: canvas board, 99 mines', async ({ gamePage }) => {
    // Expert (16×30 = 480 cells) exceeds CANVAS_THRESHOLD (250) → renders <canvas>
    await gamePage.startPreset('Expert');
    await expect(gamePage.board.locator('canvas')).toBeVisible();
    await expect(gamePage.page.getByRole('button', { name: /^Cell / })).toHaveCount(0);
    await expect(gamePage.mineCounter).toContainText('99');
  });

  test('custom preset starts game with given dimensions', async ({ gamePage }) => {
    await gamePage.smiley.click();
    await gamePage.newGameModal().waitFor();
    await gamePage.page.getByLabel('Custom').check();
    await gamePage.page.locator('#custom-rows').fill('7');
    await gamePage.page.locator('#custom-cols').fill('7');
    await gamePage.page.locator('#custom-mines').fill('5');
    await gamePage.page.getByRole('button', { name: 'Start' }).click();
    await gamePage.newGameModal().waitFor({ state: 'hidden' });
    const cells = gamePage.page.getByRole('button', { name: /^Cell \d+,\d+$/ });
    await expect(cells).toHaveCount(49);
    await expect(gamePage.mineCounter).toContainText('5');
  });

  test('NewGameModal closes when Start is clicked', async ({ gamePage }) => {
    await gamePage.smiley.click();
    await gamePage.page.getByRole('button', { name: 'Start' }).click();
    await expect(gamePage.newGameModal()).not.toBeVisible();
  });

  test('timer shows 0 before first click', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await expect(gamePage.timer).toContainText('0');
    const state = await gamePage.getGameState();
    expect(state.elapsedSeconds).toBe(0);
  });
});
