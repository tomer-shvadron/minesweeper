import { test, expect } from '../fixtures';

test.describe('Flagging cells', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.startPreset('Beginner');
    await gamePage.firstClick(4, 4);
  });

  test('right-click flags an unrevealed cell', async ({ gamePage }) => {
    const [r, c] = await gamePage.findUnrevealedSafeCell();
    await gamePage.cell(r, c).click({ button: 'right' });
    const state = await gamePage.getGameState();
    expect(state.board[r]?.[c]?.isFlagged).toBe(true);
  });

  test('mine counter decrements on flag', async ({ gamePage }) => {
    const [r, c] = await gamePage.findUnrevealedSafeCell();
    await gamePage.cell(r, c).click({ button: 'right' });
    const state = await gamePage.getGameState();
    expect(state.minesRemaining).toBe(9); // 10 − 1
  });

  test('right-click flagged cell unflags it', async ({ gamePage }) => {
    const [r, c] = await gamePage.findUnrevealedSafeCell();
    await gamePage.cell(r, c).click({ button: 'right' });
    await gamePage.cell(r, c).click({ button: 'right' });
    const state = await gamePage.getGameState();
    expect(state.board[r]?.[c]?.isFlagged).toBe(false);
  });

  test('mine counter goes negative when flags exceed mines (11 flags on beginner/10 mines)', async ({
    gamePage,
  }) => {
    const state = await gamePage.getGameState();
    let flagged = 0;
    for (let r = 0; r < state.config.rows && flagged < 11; r++) {
      for (let c = 0; c < state.config.cols && flagged < 11; c++) {
        const cell = state.board[r]?.[c];
        if (cell && !cell.isRevealed) {
          await gamePage.cell(r, c).click({ button: 'right' });
          flagged++;
        }
      }
    }
    const after = await gamePage.getGameState();
    expect(after.minesRemaining).toBeLessThan(0);
  });

  test('cannot flag a revealed cell', async ({ gamePage }) => {
    // Find a revealed cell (the first click and flood fill will have created some)
    const before = await gamePage.getGameState();
    let targetR = -1,
      targetC = -1;
    outer: for (let r = 0; r < before.config.rows; r++) {
      for (let c = 0; c < before.config.cols; c++) {
        if (before.board[r]?.[c]?.isRevealed) {
          targetR = r;
          targetC = c;
          break outer;
        }
      }
    }
    if (targetR === -1) {
      test.skip();
      return;
    }
    await gamePage.cell(targetR, targetC).click({ button: 'right' });
    const after = await gamePage.getGameState();
    expect(after.board[targetR]?.[targetC]?.isFlagged).toBe(false);
  });

  test('flags are cleared on new game', async ({ gamePage }) => {
    const [r, c] = await gamePage.findUnrevealedSafeCell();
    await gamePage.cell(r, c).click({ button: 'right' });
    const flaggedState = await gamePage.getGameState();
    expect(flaggedState.board[r]?.[c]?.isFlagged).toBe(true);
    // Start new game via smiley → modal
    await gamePage.smiley.click();
    await gamePage.page.getByRole('button', { name: 'Start' }).click();
    await gamePage.newGameModal().waitFor({ state: 'hidden' });
    const newState = await gamePage.getGameState();
    for (const row of newState.board) {
      for (const cell of row) {
        expect(cell.isFlagged).toBe(false);
      }
    }
  });
});
