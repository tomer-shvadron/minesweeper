/**
 * Integration tests: full game flow through the store layer.
 *
 * These tests verify end-to-end playability — from first click through
 * mine placement, reveal/flag/chord operations, to win and loss detection.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import { countUnrevealedSafe } from '@/services/board.service';
import { useGameStore } from '@/stores/game.store';
import type { Board, BoardConfig, CellState, CellValue } from '@/types/game.types';

const beginner = DIFFICULTY_PRESETS.beginner;

function makeBoard(rows: Partial<CellState>[][]): Board {
  return rows.map((row) =>
    row.map((cell) => ({
      hasMine: false,
      isRevealed: false,
      isFlagged: false,
      isQuestionMark: false,
      value: 0 as CellValue,
      isExploded: false,
      ...cell,
    }))
  );
}

function resetStore(config: BoardConfig = beginner) {
  useGameStore.getState().startNewGame(config);
}

describe('Game Flow Integration', () => {
  beforeEach(() => resetStore());

  // ── First click safety ─────────────────────────────────────────────────
  describe('first click guarantees', () => {
    it('first click always reveals a safe cell', () => {
      for (let i = 0; i < 30; i++) {
        resetStore();
        useGameStore.getState().revealCell(4, 4);
        const state = useGameStore.getState();
        expect(state.board[4]?.[4]?.hasMine).toBe(false);
        expect(state.board[4]?.[4]?.isRevealed).toBe(true);
        expect(state.status).not.toBe('lost');
      }
    });

    it('first click creates a 3×3 safe zone around the clicked cell', () => {
      for (let i = 0; i < 20; i++) {
        resetStore();
        useGameStore.getState().revealCell(4, 4);
        const { board } = useGameStore.getState();
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            expect(board[4 + dr]?.[4 + dc]?.hasMine).toBe(false);
          }
        }
      }
    });

    it('first click on corner still has safe zone (only valid neighbors)', () => {
      for (let i = 0; i < 20; i++) {
        resetStore();
        useGameStore.getState().revealCell(0, 0);
        const { board } = useGameStore.getState();
        expect(board[0]?.[0]?.hasMine).toBe(false);
        expect(board[0]?.[1]?.hasMine).toBe(false);
        expect(board[1]?.[0]?.hasMine).toBe(false);
        expect(board[1]?.[1]?.hasMine).toBe(false);
      }
    });

    it('places the correct number of mines on first click', () => {
      useGameStore.getState().revealCell(4, 4);
      const { board, config } = useGameStore.getState();
      const mineCount = board.flat().filter((c) => c.hasMine).length;
      expect(mineCount).toBe(config.mines);
    });

    it('transitions from idle → playing on first click', () => {
      expect(useGameStore.getState().status).toBe('idle');
      useGameStore.getState().revealCell(4, 4);
      expect(useGameStore.getState().status).toBe('playing');
    });

    it('sets firstClick coordinates', () => {
      useGameStore.getState().revealCell(3, 7);
      expect(useGameStore.getState().firstClick).toEqual([3, 7]);
    });

    it('increments totalClicks on first click', () => {
      expect(useGameStore.getState().totalClicks).toBe(0);
      useGameStore.getState().revealCell(4, 4);
      expect(useGameStore.getState().totalClicks).toBe(1);
    });
  });

  // ── Win detection (incremental via unrevealedSafeCount) ────────────────
  describe('win detection', () => {
    it('wins when all non-mine cells are revealed', () => {
      // 3×3 board with 1 mine at [0,0]
      const board = makeBoard([
        [{ hasMine: true }, { value: 1 as CellValue }, { value: 0 as CellValue }],
        [
          { value: 1 as CellValue },
          { value: 1 as CellValue, isRevealed: true },
          { value: 0 as CellValue, isRevealed: true },
        ],
        [
          { value: 0 as CellValue, isRevealed: true },
          { value: 0 as CellValue, isRevealed: true },
          { value: 0 as CellValue, isRevealed: true },
        ],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 3, cols: 3, mines: 1 },
        isFirstClick: false,
        unrevealedSafeCount: 2, // [0,1] and [1,0] remain
      });

      // Reveal [0,1]
      useGameStore.getState().revealCell(0, 1);
      expect(useGameStore.getState().status).toBe('playing');
      expect(useGameStore.getState().unrevealedSafeCount).toBe(1);

      // Reveal [1,0] — last safe cell
      useGameStore.getState().revealCell(1, 0);
      expect(useGameStore.getState().status).toBe('won');
      expect(useGameStore.getState().unrevealedSafeCount).toBe(0);
    });

    it('wins via chord reveal of last safe cells', () => {
      // [0,0]=revealed v=1, [0,1]=flagged mine, [1,0]=unrevealed safe, [1,1]=revealed
      const board = makeBoard([
        [
          { isRevealed: true, value: 1 as CellValue },
          { isFlagged: true, hasMine: true },
        ],
        [{ value: 1 as CellValue }, { isRevealed: true, value: 1 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
        unrevealedSafeCount: 1,
      });

      useGameStore.getState().chordClick(0, 0);
      expect(useGameStore.getState().status).toBe('won');
    });

    it('tracks unrevealedSafeCount correctly through a multi-reveal cascade', () => {
      // Use a real board generation to ensure counts are correct
      resetStore({ rows: 9, cols: 9, mines: 10 });
      useGameStore.getState().revealCell(4, 4);
      const state = useGameStore.getState();
      const actualUnrevealed = countUnrevealedSafe(state.board);
      expect(state.unrevealedSafeCount).toBe(actualUnrevealed);
    });
  });

  // ── Loss detection (O(1) via isExploded) ───────────────────────────────
  describe('loss detection', () => {
    it('loses when clicking a mine directly', () => {
      const board = makeBoard([
        [{ hasMine: true }, { value: 1 as CellValue }],
        [{ value: 1 as CellValue }, { isRevealed: true, value: 0 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
        unrevealedSafeCount: 1,
      });

      useGameStore.getState().revealCell(0, 0);
      const state = useGameStore.getState();
      expect(state.status).toBe('lost');
      expect(state.board[0]?.[0]?.isExploded).toBe(true);
    });

    it('reveals all mines on loss', () => {
      const board = makeBoard([
        [{ hasMine: true }, { hasMine: true }],
        [{ value: 2 as CellValue, isRevealed: true }, { value: 2 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 2 },
        isFirstClick: false,
        unrevealedSafeCount: 1,
      });

      useGameStore.getState().revealCell(0, 0);
      const { board: newBoard } = useGameStore.getState();
      // Both mines should be revealed
      expect(newBoard[0]?.[0]?.isRevealed).toBe(true);
      expect(newBoard[0]?.[1]?.isRevealed).toBe(true);
    });

    it('generates mineRevealOrder on loss for explosion animation', () => {
      const board = makeBoard([
        [{ hasMine: true }, { value: 1 as CellValue }],
        [{ value: 1 as CellValue }, { hasMine: true }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 2 },
        isFirstClick: false,
        unrevealedSafeCount: 0,
      });

      useGameStore.getState().revealCell(0, 0);
      const state = useGameStore.getState();
      expect(state.mineRevealOrder.length).toBeGreaterThan(0);
      // The exploded cell should NOT be in the reveal order (it's already shown)
      expect(state.mineRevealOrder.some(([r, c]) => r === 0 && c === 0)).toBe(false);
    });

    it('loses via chord reveal when flag placement is wrong', () => {
      // [1,0]=revealed v=1, [0,0]=flagged (no mine!), [0,1]=mine (unflagged)
      const board = makeBoard([
        [{ isFlagged: true }, { hasMine: true }],
        [{ isRevealed: true, value: 1 as CellValue }, { value: 1 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
        unrevealedSafeCount: 1,
      });

      useGameStore.getState().chordClick(1, 0);
      expect(useGameStore.getState().status).toBe('lost');
    });
  });

  // ── Post-game guards ───────────────────────────────────────────────────
  describe('post-game immutability', () => {
    it('revealCell is a no-op after win', () => {
      useGameStore.setState({ status: 'won' });
      const before = useGameStore.getState().board;
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().board).toBe(before);
    });

    it('revealCell is a no-op after loss', () => {
      useGameStore.setState({ status: 'lost' });
      const before = useGameStore.getState().board;
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().board).toBe(before);
    });

    it('flagCell is a no-op after win', () => {
      useGameStore.setState({ status: 'won' });
      const before = useGameStore.getState().board;
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board).toBe(before);
    });

    it('flagCell is a no-op after loss', () => {
      useGameStore.setState({ status: 'lost' });
      const before = useGameStore.getState().board;
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board).toBe(before);
    });

    it('chordClick is a no-op when idle', () => {
      useGameStore.setState({ status: 'idle' });
      const before = useGameStore.getState().board;
      useGameStore.getState().chordClick(0, 0);
      expect(useGameStore.getState().board).toBe(before);
    });

    it('chordClick is a no-op after win', () => {
      useGameStore.setState({ status: 'won' });
      const before = useGameStore.getState().board;
      useGameStore.getState().chordClick(0, 0);
      expect(useGameStore.getState().board).toBe(before);
    });

    it('chordClick is a no-op after loss', () => {
      useGameStore.setState({ status: 'lost' });
      const before = useGameStore.getState().board;
      useGameStore.getState().chordClick(0, 0);
      expect(useGameStore.getState().board).toBe(before);
    });

    it('tick does not increment timer after game over', () => {
      useGameStore.setState({ status: 'won', elapsedSeconds: 42 });
      useGameStore.getState().tick();
      expect(useGameStore.getState().elapsedSeconds).toBe(42);

      useGameStore.setState({ status: 'lost', elapsedSeconds: 99 });
      useGameStore.getState().tick();
      expect(useGameStore.getState().elapsedSeconds).toBe(99);
    });
  });

  // ── Flag toggling ──────────────────────────────────────────────────────
  describe('flag operations during play', () => {
    it('flag → unflag cycle without question marks', () => {
      useGameStore.setState({ status: 'playing' });
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(true);

      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(false);
      expect(useGameStore.getState().board[0]?.[0]?.isQuestionMark).toBe(false);
    });

    it('flag → question mark → clear cycle with question marks enabled', () => {
      useGameStore.setState({ status: 'playing' });

      // unflagged → flagged
      useGameStore.getState().flagCell(0, 0, true);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(true);

      // flagged → question mark
      useGameStore.getState().flagCell(0, 0, true);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(false);
      expect(useGameStore.getState().board[0]?.[0]?.isQuestionMark).toBe(true);

      // question mark → clear
      useGameStore.getState().flagCell(0, 0, true);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(false);
      expect(useGameStore.getState().board[0]?.[0]?.isQuestionMark).toBe(false);
    });

    it('flagging updates minesRemaining', () => {
      useGameStore.setState({ status: 'playing' });
      const before = useGameStore.getState().minesRemaining;
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().minesRemaining).toBe(before - 1);
    });

    it('cannot flag a revealed cell', () => {
      const board = makeBoard([[{ isRevealed: true, value: 0 as CellValue }]]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 1, cols: 1, mines: 0 },
      });
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(false);
    });

    it('cannot reveal a flagged cell', () => {
      const board = makeBoard([[{ isFlagged: true }]]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 1, cols: 1, mines: 0 },
        isFirstClick: false,
        unrevealedSafeCount: 1,
      });
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().board[0]?.[0]?.isRevealed).toBe(false);
    });
  });

  // ── Full game walkthrough ──────────────────────────────────────────────
  describe('complete beginner game flow', () => {
    it('plays a complete game from start to win', () => {
      // Use a board with more mines to avoid instant win from flood-fill
      const config: BoardConfig = { rows: 9, cols: 9, mines: 10 };
      resetStore(config);

      // First click
      useGameStore.getState().revealCell(4, 4);
      let state = useGameStore.getState();
      expect(state.isFirstClick).toBe(false);
      // Status should be playing or won (could win if flood-fill reveals all safe cells)
      expect(['playing', 'won']).toContain(state.status);

      if (state.status === 'won') {
        return; // Already won from flood-fill cascade
      }

      // Reveal all non-mine, non-revealed cells until we win
      let maxIterations = 100;
      while (useGameStore.getState().status === 'playing' && maxIterations-- > 0) {
        state = useGameStore.getState();
        let revealed = false;
        for (let r = 0; r < config.rows && !revealed; r++) {
          for (let c = 0; c < config.cols && !revealed; c++) {
            const cell = state.board[r]?.[c];
            if (cell && !cell.hasMine && !cell.isRevealed && !cell.isFlagged) {
              useGameStore.getState().revealCell(r, c);
              revealed = true;
            }
          }
        }
        if (!revealed) {
          break;
        }
      }

      expect(useGameStore.getState().status).toBe('won');
    });

    it('startNewGame fully resets after a loss', () => {
      // Trigger a loss
      const board = makeBoard([
        [{ hasMine: true }, { value: 1 as CellValue }],
        [{ value: 1 as CellValue }, { value: 0 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
        elapsedSeconds: 55,
      });
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().status).toBe('lost');

      // Reset
      resetStore();
      const state = useGameStore.getState();
      expect(state.status).toBe('idle');
      expect(state.isFirstClick).toBe(true);
      expect(state.elapsedSeconds).toBe(0);
      expect(state.mineRevealOrder).toEqual([]);
      expect(state.totalClicks).toBe(0);
      expect(state.board.flat().every((c) => !c.hasMine && !c.isRevealed)).toBe(true);
    });
  });

  // ── Multi-click sequence (totalClicks tracking) ────────────────────────
  describe('totalClicks tracking', () => {
    it('increments on each reveal', () => {
      useGameStore.getState().revealCell(4, 4);
      expect(useGameStore.getState().totalClicks).toBe(1);

      // Need to find an unrevealed safe cell for the second click
      const { board } = useGameStore.getState();
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < (board[0]?.length ?? 0); c++) {
          const cell = board[r]?.[c];
          if (cell && !cell.isRevealed && !cell.hasMine && !cell.isFlagged) {
            useGameStore.getState().revealCell(r, c);
            expect(useGameStore.getState().totalClicks).toBe(2);
            return;
          }
        }
      }
    });
  });
});
