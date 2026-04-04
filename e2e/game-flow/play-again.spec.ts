import { test, expect } from '../fixtures';

test.describe('Play Again & Change Level', () => {
  test('Play Again resets game without modal (same difficulty)', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Try Again' }).click();
    await expect(gamePage.newGameModal()).not.toBeVisible();
    await expect(gamePage.timer).toContainText('0');
    await expect(gamePage.gameOverBanner).not.toBeVisible();
    await expect(gamePage.smiley).toContainText('🙂');
    const cells = gamePage.allCells;
    await expect(cells).toHaveCount(81);
  });

  test('Play Again after win resets to same difficulty', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.winGame();
    const hsp = gamePage.highScorePrompt();
    if (await hsp.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gamePage.page.getByRole('button', { name: 'Skip' }).click();
    }
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Play Again' }).click();
    const state = await gamePage.getGameState();
    expect(state.status).toBe('idle');
    expect(state.config.mines).toBe(10);
  });

  test('Change Level opens NewGameModal', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Change Level' }).click();
    await expect(gamePage.newGameModal()).toBeVisible();
  });

  test('Change Level → switch to Expert → new Expert game', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Change Level' }).click();
    await gamePage.page.getByLabel('Expert').check();
    await gamePage.page.getByRole('button', { name: 'Start' }).click();
    await expect(gamePage.newGameModal()).not.toBeVisible();
    // Expert (16×30 = 480 cells) exceeds CANVAS_THRESHOLD (250) → renders <canvas>, not cell buttons
    await expect(gamePage.board.locator('canvas')).toBeVisible();
    await expect(gamePage.mineCounter).toContainText('99');
  });

  test('mine counter resets to full count on Play Again', async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.firstClick(4, 4);
    const state = await gamePage.getGameState();
    for (const r of [0, 1]) {
      const cell = state.board[r]?.[0];
      if (cell && !cell.isRevealed) {
        await gamePage.cell(r, 0).click({ button: 'right' });
      }
    }
    await gamePage.loseGame();
    await gamePage.gameOverBanner.waitFor();
    await gamePage.page.getByRole('button', { name: 'Try Again' }).click();
    await expect(gamePage.mineCounter).toContainText('10');
  });
});
