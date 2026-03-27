import { beforeEach, describe, expect, it } from 'vitest';

import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import { createEmptyBoard } from '@/services/board.service';
import { useGameStore } from '@/stores/game.store';
import type { Board, CellState, CellValue } from '@/types/game.types';

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

const resetStore = () =>
  useGameStore.setState({
    board: createEmptyBoard(beginner),
    status: 'idle',
    config: beginner,
    elapsedSeconds: 0,
    minesRemaining: beginner.mines,
    isFirstClick: true,
    isPressingCell: false,
  });

describe('game.store', () => {
  beforeEach(resetStore);

  // ----------------------------------------------------------------
  describe('startNewGame', () => {
    it('creates an empty board sized to the given config', () => {
      useGameStore.getState().startNewGame({ rows: 5, cols: 7, mines: 3 });
      const { board } = useGameStore.getState();
      expect(board).toHaveLength(5);
      board.forEach((row) => expect(row).toHaveLength(7));
    });

    it('sets the new config', () => {
      const config = { rows: 5, cols: 7, mines: 3 };
      useGameStore.getState().startNewGame(config);
      expect(useGameStore.getState().config).toEqual(config);
    });

    it('resets status to idle regardless of previous state', () => {
      useGameStore.setState({ status: 'won' });
      useGameStore.getState().startNewGame(beginner);
      expect(useGameStore.getState().status).toBe('idle');
    });

    it('resets elapsedSeconds to 0', () => {
      useGameStore.setState({ elapsedSeconds: 120 });
      useGameStore.getState().startNewGame(beginner);
      expect(useGameStore.getState().elapsedSeconds).toBe(0);
    });

    it('resets minesRemaining to config.mines', () => {
      useGameStore.setState({ minesRemaining: 0 });
      useGameStore.getState().startNewGame({ rows: 9, cols: 9, mines: 10 });
      expect(useGameStore.getState().minesRemaining).toBe(10);
    });

    it('resets isFirstClick to true', () => {
      useGameStore.setState({ isFirstClick: false });
      useGameStore.getState().startNewGame(beginner);
      expect(useGameStore.getState().isFirstClick).toBe(true);
    });

    it('uses the current config when none is provided', () => {
      useGameStore.setState({ config: { rows: 7, cols: 7, mines: 5 } });
      useGameStore.getState().startNewGame();
      expect(useGameStore.getState().config).toEqual({ rows: 7, cols: 7, mines: 5 });
    });

    it('creates cells all in their initial un-mined, unrevealed state', () => {
      useGameStore.getState().startNewGame(beginner);
      useGameStore
        .getState()
        .board.flat()
        .forEach((cell) => {
          expect(cell.hasMine).toBe(false);
          expect(cell.isRevealed).toBe(false);
          expect(cell.isFlagged).toBe(false);
          expect(cell.isExploded).toBe(false);
        });
    });
  });

  // ----------------------------------------------------------------
  describe('revealCell', () => {
    it('places mines on the first click (isFirstClick becomes false)', () => {
      useGameStore.getState().revealCell(4, 4);
      const { isFirstClick, board } = useGameStore.getState();
      expect(isFirstClick).toBe(false);
      expect(board.flat().filter((c) => c.hasMine)).toHaveLength(beginner.mines);
    });

    it('transitions status from idle to playing on the first click', () => {
      useGameStore.getState().revealCell(4, 4);
      expect(useGameStore.getState().status).toBe('playing');
    });

    it('reveals the target cell', () => {
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().board[0]?.[0]?.isRevealed).toBe(true);
    });

    it('never places a mine on the first-clicked cell', () => {
      for (let i = 0; i < 20; i++) {
        resetStore();
        useGameStore.getState().revealCell(4, 4);
        expect(useGameStore.getState().board[4]?.[4]?.hasMine).toBe(false);
      }
    });

    it('sets status to lost when a mine cell is clicked', () => {
      const board = makeBoard([
        [{ hasMine: true }, { value: 1 as CellValue }],
        [{ value: 1 as CellValue }, { isRevealed: true }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
      });
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().status).toBe('lost');
    });

    it('sets status to won when the last non-mine cell is revealed', () => {
      // 2×2: mine at [0,0], [0,1] and [1,0] already revealed, [1,1] is the last safe cell
      const board = makeBoard([
        [{ hasMine: true }, { isRevealed: true, value: 1 as CellValue }],
        [{ isRevealed: true, value: 1 as CellValue }, { value: 1 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
      });
      useGameStore.getState().revealCell(1, 1);
      expect(useGameStore.getState().status).toBe('won');
    });

    it('is a no-op when the game is already won', () => {
      useGameStore.setState({ status: 'won' });
      const boardBefore = useGameStore.getState().board;
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().board).toBe(boardBefore);
    });

    it('is a no-op when the game is already lost', () => {
      useGameStore.setState({ status: 'lost' });
      const boardBefore = useGameStore.getState().board;
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().board).toBe(boardBefore);
    });

    it('updates minesRemaining after a flag-less first reveal', () => {
      useGameStore.getState().revealCell(4, 4);
      expect(useGameStore.getState().minesRemaining).toBe(beginner.mines);
    });
  });

  // ----------------------------------------------------------------
  describe('flagCell', () => {
    beforeEach(() => {
      useGameStore.setState({ status: 'playing' });
    });

    it('flags an unrevealed cell and decrements minesRemaining', () => {
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(true);
      expect(useGameStore.getState().minesRemaining).toBe(beginner.mines - 1);
    });

    it('unflags a previously flagged cell and increments minesRemaining', () => {
      const board = makeBoard([[{ isFlagged: true }]]);
      useGameStore.setState({ board, config: { rows: 1, cols: 1, mines: 1 }, minesRemaining: 0 });
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board[0]?.[0]?.isFlagged).toBe(false);
      expect(useGameStore.getState().minesRemaining).toBe(1);
    });

    it('cycles to question mark when allowQuestionMarks is true', () => {
      const board = makeBoard([[{ isFlagged: true }]]);
      useGameStore.setState({ board, config: { rows: 1, cols: 1, mines: 1 }, minesRemaining: 0 });
      useGameStore.getState().flagCell(0, 0, true);
      expect(useGameStore.getState().board[0]?.[0]?.isQuestionMark).toBe(true);
    });

    it('is a no-op when game status is won', () => {
      useGameStore.setState({ status: 'won' });
      const boardBefore = useGameStore.getState().board;
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board).toBe(boardBefore);
    });

    it('is a no-op when game status is lost', () => {
      useGameStore.setState({ status: 'lost' });
      const boardBefore = useGameStore.getState().board;
      useGameStore.getState().flagCell(0, 0, false);
      expect(useGameStore.getState().board).toBe(boardBefore);
    });
  });

  // ----------------------------------------------------------------
  describe('chordClick', () => {
    it('is a no-op when status is idle', () => {
      useGameStore.setState({ status: 'idle' });
      const boardBefore = useGameStore.getState().board;
      useGameStore.getState().chordClick(0, 0);
      expect(useGameStore.getState().board).toBe(boardBefore);
    });

    it('is a no-op when status is won', () => {
      useGameStore.setState({ status: 'won' });
      const boardBefore = useGameStore.getState().board;
      useGameStore.getState().chordClick(0, 0);
      expect(useGameStore.getState().board).toBe(boardBefore);
    });

    it('reveals unflagged neighbors when flag count matches the cell value', () => {
      // [0,0]=revealed v=1, [0,1]=flagged mine, [1,0] and [1,1]=safe unrevealed
      const board = makeBoard([
        [
          { isRevealed: true, value: 1 as CellValue },
          { isFlagged: true, hasMine: true },
        ],
        [{ value: 0 as CellValue }, { value: 0 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
      });
      useGameStore.getState().chordClick(0, 0);
      const { board: newBoard } = useGameStore.getState();
      expect(newBoard[1]?.[0]?.isRevealed).toBe(true);
      expect(newBoard[1]?.[1]?.isRevealed).toBe(true);
    });

    it('sets status to won when chord reveals the last safe cell', () => {
      const board = makeBoard([
        [
          { isRevealed: true, value: 1 as CellValue },
          { isFlagged: true, hasMine: true },
        ],
        [{ value: 1 as CellValue }, { isRevealed: true }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
      });
      useGameStore.getState().chordClick(0, 0);
      expect(useGameStore.getState().status).toBe('won');
    });

    it('sets status to lost when a chord reveals a mine (wrong flag)', () => {
      // Flag is on [0,0] (no mine), mine is at [0,1] (unflagged)
      const board = makeBoard([
        [{ isFlagged: true }, { hasMine: true }],
        [{ isRevealed: true, value: 1 as CellValue }, { value: 0 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'playing',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: false,
      });
      useGameStore.getState().chordClick(1, 0);
      expect(useGameStore.getState().status).toBe('lost');
    });
  });

  // ----------------------------------------------------------------
  describe('tick', () => {
    it('increments elapsedSeconds when playing', () => {
      useGameStore.setState({ status: 'playing', elapsedSeconds: 5 });
      useGameStore.getState().tick();
      expect(useGameStore.getState().elapsedSeconds).toBe(6);
    });

    it('does not increment when idle', () => {
      useGameStore.setState({ status: 'idle', elapsedSeconds: 5 });
      useGameStore.getState().tick();
      expect(useGameStore.getState().elapsedSeconds).toBe(5);
    });

    it('does not increment when won', () => {
      useGameStore.setState({ status: 'won', elapsedSeconds: 42 });
      useGameStore.getState().tick();
      expect(useGameStore.getState().elapsedSeconds).toBe(42);
    });

    it('does not increment when lost', () => {
      useGameStore.setState({ status: 'lost', elapsedSeconds: 99 });
      useGameStore.getState().tick();
      expect(useGameStore.getState().elapsedSeconds).toBe(99);
    });

    it('accumulates correctly over multiple ticks', () => {
      useGameStore.setState({ status: 'playing', elapsedSeconds: 0 });
      for (let i = 0; i < 5; i++) {
        useGameStore.getState().tick();
      }
      expect(useGameStore.getState().elapsedSeconds).toBe(5);
    });
  });

  // ----------------------------------------------------------------
  describe('setCellPressStart / setCellPressEnd', () => {
    it('sets isPressingCell to true', () => {
      useGameStore.getState().setCellPressStart();
      expect(useGameStore.getState().isPressingCell).toBe(true);
    });

    it('sets isPressingCell to false', () => {
      useGameStore.setState({ isPressingCell: true });
      useGameStore.getState().setCellPressEnd();
      expect(useGameStore.getState().isPressingCell).toBe(false);
    });

    it('toggling start then end leaves isPressingCell false', () => {
      useGameStore.getState().setCellPressStart();
      useGameStore.getState().setCellPressEnd();
      expect(useGameStore.getState().isPressingCell).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  describe('generating status / _applyGeneratedBoard', () => {
    it('revealCell is a no-op when status is generating', () => {
      useGameStore.setState({ status: 'generating' });
      const boardBefore = useGameStore.getState().board;
      useGameStore.getState().revealCell(0, 0);
      expect(useGameStore.getState().board).toBe(boardBefore);
    });

    it('startNewGame resets generating status to idle', () => {
      useGameStore.setState({ status: 'generating' });
      useGameStore.getState().startNewGame(beginner);
      expect(useGameStore.getState().status).toBe('idle');
    });

    it('_applyGeneratedBoard reveals the pending cell and transitions to playing', () => {
      // pendingRevealRow/pendingRevealCol are module-level vars defaulting to 0
      // We build a 2×2 board where [0,0] is a safe cell with value 1
      const board = makeBoard([
        [{ value: 1 as CellValue }, { hasMine: true }],
        [{ value: 1 as CellValue }, { value: 1 as CellValue }],
      ]);
      useGameStore.setState({
        board,
        status: 'generating',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: true,
      });
      useGameStore.getState()._applyGeneratedBoard(board);
      const state = useGameStore.getState();
      // [0,0] should now be revealed (pending cell)
      expect(state.board[0]?.[0]?.isRevealed).toBe(true);
      expect(['playing', 'won', 'lost']).toContain(state.status);
      expect(state.isFirstClick).toBe(false);
    });

    it('_applyGeneratedBoard sets status to won when only mines remain unrevealed', () => {
      // 2×2 board: mine at [1,1], [0,1] and [1,0] already revealed, [0,0] is the pending safe cell
      const board = makeBoard([
        [{ value: 1 as CellValue }, { isRevealed: true, value: 1 as CellValue }],
        [{ isRevealed: true, value: 1 as CellValue }, { hasMine: true }],
      ]);
      useGameStore.setState({
        board,
        status: 'generating',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: true,
      });
      // pendingRevealRow=0, pendingRevealCol=0 by default (module-level)
      useGameStore.getState()._applyGeneratedBoard(board);
      const state = useGameStore.getState();
      // Revealing [0,0] means all non-mine cells are now revealed → won
      expect(state.status).toBe('won');
    });

    it('_applyGeneratedBoard sets status to lost when pending cell is a mine', () => {
      // Mine is at [0,0] (the pending cell)
      const board = makeBoard([
        [{ hasMine: true }, { value: 1 as CellValue }],
        [{ value: 1 as CellValue }, { isRevealed: true }],
      ]);
      useGameStore.setState({
        board,
        status: 'generating',
        config: { rows: 2, cols: 2, mines: 1 },
        isFirstClick: true,
      });
      useGameStore.getState()._applyGeneratedBoard(board);
      expect(useGameStore.getState().status).toBe('lost');
    });

    it('partialize maps generating status to idle', () => {
      useGameStore.setState({ status: 'generating' });
      const partialize = (
        useGameStore as unknown as {
          persist: {
            getOptions(): { partialize?: (s: ReturnType<typeof useGameStore.getState>) => unknown };
          };
        }
      ).persist.getOptions().partialize;
      const result = partialize?.(useGameStore.getState()) as { status: string } | undefined;
      expect(result?.status).toBe('idle');
    });

    it('partialize preserves playing status as playing', () => {
      useGameStore.setState({ status: 'playing' });
      const partialize = (
        useGameStore as unknown as {
          persist: {
            getOptions(): { partialize?: (s: ReturnType<typeof useGameStore.getState>) => unknown };
          };
        }
      ).persist.getOptions().partialize;
      const result = partialize?.(useGameStore.getState()) as { status: string } | undefined;
      expect(result?.status).toBe('playing');
    });
  });
});
