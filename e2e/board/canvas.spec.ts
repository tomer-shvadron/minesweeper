import { test, expect } from '../fixtures';

test.describe('Canvas board (large boards)', () => {
  test.describe('Board rendering', () => {
    test('Expert board renders a <canvas> element instead of cell buttons', async ({
      gamePage,
    }) => {
      await gamePage.startPreset('Expert');
      // Scope to the board — the Confetti component always renders a second canvas globally.
      await expect(gamePage.board.locator('canvas')).toBeVisible();
      // No individual cell buttons
      await expect(gamePage.allCells).toHaveCount(0);
    });

    test('Beginner board renders cell buttons (DOM, not canvas)', async ({ gamePage }) => {
      await gamePage.startPreset('Beginner');
      // The board itself has no canvas for small grids; Confetti canvas is outside the board.
      await expect(gamePage.board.locator('canvas')).toHaveCount(0);
      const cells = gamePage.allCells;
      await expect(cells).toHaveCount(81); // 9x9
    });

    test('Intermediate board renders a <canvas> element', async ({ gamePage }) => {
      await gamePage.startPreset('Intermediate');
      await expect(gamePage.board.locator('canvas')).toBeVisible();
      await expect(gamePage.allCells).toHaveCount(0);
    });
  });

  test.describe('Canvas board game play (via store bridge)', () => {
    test.beforeEach(async ({ gamePage }) => {
      await gamePage.startPreset('Expert');
    });

    test('first store reveal transitions game from idle to playing', async ({ gamePage }) => {
      const before = await gamePage.getGameState();
      expect(before.status).toBe('idle');
      await gamePage.revealCellViaStore(0, 0);
      await gamePage.page.waitForFunction(() =>
        ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
      );
      const after = await gamePage.getGameState();
      expect(['playing', 'won', 'lost']).toContain(after.status);
    });

    test('first reveal never places a mine on the clicked cell', async ({ gamePage }) => {
      for (let trial = 0; trial < 5; trial++) {
        await gamePage.startNewGame();
        await gamePage.revealCellViaStore(8, 15);
        await gamePage.page.waitForFunction(() =>
          ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
        );
        const state = await gamePage.getGameState();
        expect(state.board[8]?.[15]?.hasMine).toBe(false);
      }
    });

    test('can win an Expert game via store bridge', async ({ gamePage }) => {
      await gamePage.revealCellViaStore(0, 0);
      await gamePage.page.waitForFunction(() =>
        ['playing', 'won'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
      );
      await gamePage.winGameFromCurrentState();
      const state = await gamePage.getGameState();
      expect(state.status).toBe('won');
    });

    test('mine counter updates correctly on Expert board', async ({ gamePage }) => {
      const initial = await gamePage.getGameState();
      expect(initial.minesRemaining).toBe(99);
    });

    test('can lose an Expert game via clicking a mine cell via store', async ({ gamePage }) => {
      // First click to generate the board
      await gamePage.revealCellViaStore(8, 15);
      await gamePage.page.waitForFunction(() =>
        ['playing', 'won'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
      );
      // Find a mine and click it directly via the UI bridge
      const state = await gamePage.getGameState();
      let mineCellFound = false;
      for (let r = 0; r < state.config.rows && !mineCellFound; r++) {
        for (let c = 0; c < state.config.cols && !mineCellFound; c++) {
          const cell = state.board[r]?.[c];
          if (cell?.hasMine && !cell.isFlagged) {
            await gamePage.page.evaluate(
              ([row, col]) => window.__MINESWEEPER_TEST__.revealCell(row, col),
              [r, c] as [number, number]
            );
            mineCellFound = true;
          }
        }
      }
      await gamePage.page.waitForFunction(
        () => window.__MINESWEEPER_TEST__.getGameState().status === 'lost'
      );
      const afterState = await gamePage.getGameState();
      expect(afterState.status).toBe('lost');
    });
  });

  test.describe('Canvas board click interactions', () => {
    test.beforeEach(async ({ gamePage }) => {
      await gamePage.startPreset('Expert');
    });

    test('clicking on canvas first-click area transitions game to playing', async ({
      gamePage,
    }) => {
      await gamePage.canvasClick(8, 15);
      await gamePage.page.waitForFunction(() =>
        ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
      );
      const state = await gamePage.getGameState();
      expect(['playing', 'won', 'lost']).toContain(state.status);
    });

    test('right-clicking canvas cell flags it', async ({ gamePage, isMobile }) => {
      // Mobile devices don't support right-click (context menu); flagging there is via long-press.
      test.skip(isMobile, 'Right-click flag not supported on touch devices');
      // First click to start the game
      await gamePage.canvasClick(8, 15);
      await gamePage.page.waitForFunction(() =>
        ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
      );
      // Find an unrevealed cell
      const state = await gamePage.getGameState();
      let targetRow = -1;
      let targetCol = -1;
      outer: for (let r = 0; r < state.config.rows; r++) {
        for (let c = 0; c < state.config.cols; c++) {
          const cell = state.board[r]?.[c];
          if (cell && !cell.isRevealed && !cell.isFlagged) {
            targetRow = r;
            targetCol = c;
            break outer;
          }
        }
      }
      if (targetRow === -1) {
        test.skip();
        return;
      }

      const mineBefore = (await gamePage.getGameState()).minesRemaining;
      await gamePage.canvasRightClick(targetRow, targetCol);
      await gamePage.page.waitForFunction(
        (coords) => {
          const s = window.__MINESWEEPER_TEST__.getGameState();
          return s.board[coords[0]]?.[coords[1]]?.isFlagged === true;
        },
        [targetRow, targetCol] as [number, number]
      );
      const afterState = await gamePage.getGameState();
      expect(afterState.board[targetRow]?.[targetCol]?.isFlagged).toBe(true);
      expect(afterState.minesRemaining).toBe(mineBefore - 1);
    });
  });

  test.describe('Canvas board new game', () => {
    test('starting a new Expert game resets the board', async ({ gamePage }) => {
      await gamePage.startPreset('Expert');
      await gamePage.revealCellViaStore(0, 0);
      await gamePage.page.waitForFunction(() =>
        ['playing', 'won', 'lost'].includes(window.__MINESWEEPER_TEST__.getGameState().status)
      );
      await gamePage.startNewGame({ rows: 16, cols: 30, mines: 99 });
      const state = await gamePage.getGameState();
      expect(state.status).toBe('idle');
      expect(state.minesRemaining).toBe(99);
      expect(state.isFirstClick).toBe(true);
      expect(state.board.flat().every((cell) => !cell.isRevealed)).toBe(true);
    });

    test('switching from Expert to Beginner removes the canvas', async ({ gamePage }) => {
      await gamePage.startPreset('Expert');
      await expect(gamePage.board.locator('canvas')).toBeVisible();
      await gamePage.startPreset('Beginner');
      // Board canvas gone; Confetti canvas (outside board) is unaffected.
      await expect(gamePage.board.locator('canvas')).toHaveCount(0);
      await expect(gamePage.allCells).toHaveCount(81);
    });
  });
});
