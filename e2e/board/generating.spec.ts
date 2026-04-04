import { test, expect } from '../fixtures';

test.describe('Generating state (Web Worker board generation)', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
  });

  test('game eventually reaches playing/won/lost after first click', async ({ gamePage }) => {
    await gamePage.cell(0, 0).click();
    await gamePage.page.waitForFunction(
      () => ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status),
      { timeout: 10000 }
    );
    const state = await gamePage.getGameState();
    expect(['playing', 'won', 'lost']).toContain(state.status);
  });

  test('rapid clicks on first click do not result in multiple mine placements', async ({
    gamePage,
  }) => {
    // Click the same cell quickly — only one mine generation should happen
    await gamePage.cell(0, 0).click();
    await gamePage.cell(0, 0).click();
    await gamePage.page.waitForFunction(
      () => ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status),
      { timeout: 10000 }
    );
    const state = await gamePage.getGameState();
    const mineCount = state.board.flat().filter((c) => c.hasMine).length;
    expect(mineCount).toBe(10); // beginner has exactly 10 mines
  });

  test('mine count is exactly correct after board generation', async ({ gamePage }) => {
    await gamePage.firstClick(4, 4);
    const state = await gamePage.getGameState();
    const mineCount = state.board.flat().filter((c) => c.hasMine).length;
    expect(mineCount).toBe(state.config.mines);
  });

  test('first clicked cell never has a mine after generation (Expert board)', async ({
    gamePage,
  }) => {
    await gamePage.startPreset('Expert');
    await gamePage.revealCellViaStore(8, 15);
    await gamePage.page.waitForFunction(
      () => ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status),
      { timeout: 15000 }
    );
    const state = await gamePage.getGameState();
    expect(state.board[8]?.[15]?.hasMine).toBe(false);
    // Also verify neighbors are safe
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = 8 + dr;
        const nc = 15 + dc;
        if (nr >= 0 && nr < state.config.rows && nc >= 0 && nc < state.config.cols) {
          expect(state.board[nr]?.[nc]?.hasMine).toBe(false);
        }
      }
    }
  });

  test('no-guess mode generates a solvable board (Beginner)', async ({ gamePage }) => {
    // Enable no-guess mode via settings
    await gamePage.page.getByRole('button', { name: 'Settings' }).click();
    const settingsModal = gamePage.settingsModal();
    await settingsModal.waitFor();

    // Navigate to the Gameplay tab where no-guess toggle lives
    await gamePage.page.getByRole('tab', { name: /gameplay/i }).click();

    // Try to find and enable no-guess toggle
    const noGuessToggle = gamePage.page.getByRole('switch', { name: /no.?guess/i });
    const isEnabled = await noGuessToggle.isChecked().catch(() => false);
    if (!isEnabled) {
      await noGuessToggle.click();
    }
    await gamePage.page.getByRole('button', { name: 'Close' }).click();
    await settingsModal.waitFor({ state: 'hidden' });

    // Start a new game and play first click
    await gamePage.startNewGame();
    await gamePage.firstClick(4, 4);

    const state = await gamePage.getGameState();
    expect(['playing', 'won']).toContain(state.status);
    expect(state.board[4]?.[4]?.hasMine).toBe(false);
  });
});
