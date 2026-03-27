import { test, expect } from '../fixtures';

test.describe('Cell reveal mechanics', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
  });

  test('first click never reveals a mine (10 trials)', async ({ gamePage }) => {
    for (let i = 0; i < 10; i++) {
      await gamePage.startNewGame();
      await gamePage.cell(0, 0).click();
      const state = await gamePage.getGameState();
      expect(state.status).not.toBe('lost');
      expect(state.board[0]?.[0]?.hasMine).toBe(false);
    }
  });

  test('clicking unrevealed cell reveals it', async ({ gamePage }) => {
    await gamePage.cell(0, 0).click();
    // Wait for board generation (Web Worker) to complete before reading cell state.
    // Without this, 'generating' status means _applyGeneratedBoard hasn't run yet
    // and isRevealed is still false.
    await gamePage.page.waitForFunction(() =>
      ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
    );
    const state = await gamePage.getGameState();
    expect(state.board[0]?.[0]?.isRevealed).toBe(true);
  });

  test('timer starts on first cell click', async ({ gamePage }) => {
    const before = await gamePage.getGameState();
    expect(before.elapsedSeconds).toBe(0);
    await gamePage.cell(0, 0).click();
    await gamePage.page.waitForFunction(
      () => window.__MINESWEEPER_TEST__.getGameState().elapsedSeconds > 0,
      { timeout: 3000 }
    );
    const after = await gamePage.getGameState();
    expect(after.elapsedSeconds).toBeGreaterThan(0);
  });

  test('clicking a revealed cell does not break state', async ({ gamePage }) => {
    await gamePage.cell(0, 0).click();
    const after1 = await gamePage.getGameState();
    const cellBefore = after1.board[0]?.[0];
    await gamePage.cell(0, 0).click();
    const after2 = await gamePage.getGameState();
    const cellAfter = after2.board[0]?.[0];
    expect(cellAfter?.isRevealed).toBe(true);
    expect(cellAfter?.hasMine).toBe(cellBefore?.hasMine);
  });

  test('cannot reveal a flagged cell', async ({ gamePage }) => {
    await gamePage.firstClick(4, 4);
    const [r, c] = await gamePage.findUnrevealedSafeCell();
    await gamePage.cell(r, c).click({ button: 'right' });
    const flaggedState = await gamePage.getGameState();
    expect(flaggedState.board[r]?.[c]?.isFlagged).toBe(true);
    await gamePage.cell(r, c).click();
    const afterState = await gamePage.getGameState();
    expect(afterState.board[r]?.[c]?.isFlagged).toBe(true);
    expect(afterState.board[r]?.[c]?.isRevealed).toBe(false);
  });

  test('game status changes to playing after first click', async ({ gamePage }) => {
    const before = await gamePage.getGameState();
    expect(before.status).toBe('idle');
    await gamePage.cell(0, 0).click();
    await gamePage.waitForStatus('playing');
  });
});
