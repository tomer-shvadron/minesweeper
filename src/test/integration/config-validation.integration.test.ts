/**
 * Integration tests: custom configuration validation.
 *
 * Tests sanitizeInt (from useNewGameModalLogic), validateConfig (game store),
 * and board.service dimension/mine validation.
 */
import { describe, expect, it } from 'vitest';

import {
  MAX_COLS,
  MAX_ROWS,
  MIN_COLS,
  MIN_MINES,
  MIN_ROWS,
  SAFE_ZONE_SIZE,
} from '@/constants/game.constants';
import { createEmptyBoard, placeMines } from '@/services/board.service';
import { useGameStore } from '@/stores/game.store';

// ── sanitizeInt (extracted from useNewGameModalLogic for testability) ──
// We re-implement the same logic here because it's a local function inside
// the hook. This is the canonical test of the clamping behavior.
function sanitizeInt(raw: string, fallback: number, min: number, max: number): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

describe('sanitizeInt', () => {
  it('parses a valid integer', () => {
    expect(sanitizeInt('15', 5, 5, 30)).toBe(15);
  });

  it('floors a float', () => {
    expect(sanitizeInt('7.9', 5, 5, 30)).toBe(7);
  });

  it('clamps below min', () => {
    expect(sanitizeInt('2', 5, 5, 30)).toBe(5);
  });

  it('clamps above max', () => {
    expect(sanitizeInt('100', 5, 5, 30)).toBe(30);
  });

  it('returns fallback for empty string', () => {
    expect(sanitizeInt('', 5, 5, 30)).toBe(5);
  });

  it('returns fallback for NaN', () => {
    expect(sanitizeInt('NaN', 5, 5, 30)).toBe(5);
  });

  it('returns fallback for Infinity', () => {
    expect(sanitizeInt('Infinity', 5, 5, 30)).toBe(5);
  });

  it('returns fallback for -Infinity', () => {
    expect(sanitizeInt('-Infinity', 5, 5, 30)).toBe(5);
  });

  it('returns fallback for non-numeric string', () => {
    expect(sanitizeInt('abc', 5, 5, 30)).toBe(5);
  });

  it('handles negative input by clamping to min', () => {
    expect(sanitizeInt('-10', 5, 5, 30)).toBe(5);
  });

  it('handles "0" correctly when min > 0', () => {
    expect(sanitizeInt('0', 1, 1, 99)).toBe(1);
  });

  it('handles leading/trailing whitespace', () => {
    expect(sanitizeInt('  15  ', 5, 5, 30)).toBe(15);
  });

  it('handles string with just spaces', () => {
    expect(sanitizeInt('   ', 5, 5, 30)).toBe(5);
  });
});

// ── validateConfig (tested through startNewGame) ─────────────────────────
describe('validateConfig via startNewGame', () => {
  it('clamps rows below MIN_ROWS', () => {
    useGameStore.getState().startNewGame({ rows: 1, cols: 10, mines: 5 });
    expect(useGameStore.getState().config.rows).toBe(MIN_ROWS);
  });

  it('clamps rows above MAX_ROWS', () => {
    useGameStore.getState().startNewGame({ rows: 999, cols: 10, mines: 5 });
    expect(useGameStore.getState().config.rows).toBe(MAX_ROWS);
  });

  it('clamps cols below MIN_COLS', () => {
    useGameStore.getState().startNewGame({ rows: 10, cols: 1, mines: 5 });
    expect(useGameStore.getState().config.cols).toBe(MIN_COLS);
  });

  it('clamps cols above MAX_COLS', () => {
    useGameStore.getState().startNewGame({ rows: 10, cols: 999, mines: 5 });
    expect(useGameStore.getState().config.cols).toBe(MAX_COLS);
  });

  it('clamps mines below MIN_MINES', () => {
    useGameStore.getState().startNewGame({ rows: 10, cols: 10, mines: 0 });
    expect(useGameStore.getState().config.mines).toBe(MIN_MINES);
  });

  it('clamps mines above max (rows*cols - SAFE_ZONE_SIZE)', () => {
    // 5×5 = 25 cells, max mines = 25 - 9 = 16
    useGameStore.getState().startNewGame({ rows: 5, cols: 5, mines: 99 });
    expect(useGameStore.getState().config.mines).toBe(5 * 5 - SAFE_ZONE_SIZE);
  });

  it('floors float rows/cols/mines', () => {
    useGameStore.getState().startNewGame({ rows: 9.7, cols: 9.3, mines: 10.9 });
    const cfg = useGameStore.getState().config;
    expect(cfg.rows).toBe(9);
    expect(cfg.cols).toBe(9);
    expect(cfg.mines).toBe(10);
  });

  it('creates correct board dimensions after validation', () => {
    useGameStore.getState().startNewGame({ rows: 12, cols: 15, mines: 30 });
    const { board, config } = useGameStore.getState();
    expect(board.length).toBe(12);
    expect(board[0]?.length).toBe(15);
    expect(config).toEqual({ rows: 12, cols: 15, mines: 30 });
  });

  it('handles minimum valid board (5×5 with 1 mine)', () => {
    useGameStore.getState().startNewGame({ rows: 5, cols: 5, mines: 1 });
    const cfg = useGameStore.getState().config;
    expect(cfg.rows).toBe(5);
    expect(cfg.cols).toBe(5);
    expect(cfg.mines).toBe(1);
    // Should be playable
    useGameStore.getState().revealCell(2, 2);
    expect(useGameStore.getState().status).not.toBe('idle');
  });

  it('handles maximum mine density board', () => {
    // 5×5 with max mines (16)
    useGameStore.getState().startNewGame({ rows: 5, cols: 5, mines: 16 });
    const cfg = useGameStore.getState().config;
    expect(cfg.mines).toBe(16);
    // Should still be playable (first click safe zone of 9)
    useGameStore.getState().revealCell(2, 2);
    const state = useGameStore.getState();
    expect(state.board.flat().filter((c) => c.hasMine).length).toBe(16);
  });
});

// ── Board service: createEmptyBoard validation ──────────────────────────
describe('createEmptyBoard validation', () => {
  it('throws on zero rows', () => {
    expect(() => createEmptyBoard({ rows: 0, cols: 5, mines: 1 })).toThrow();
  });

  it('throws on zero cols', () => {
    expect(() => createEmptyBoard({ rows: 5, cols: 0, mines: 1 })).toThrow();
  });

  it('throws on negative rows', () => {
    expect(() => createEmptyBoard({ rows: -1, cols: 5, mines: 1 })).toThrow();
  });

  it('throws on negative cols', () => {
    expect(() => createEmptyBoard({ rows: 5, cols: -1, mines: 1 })).toThrow();
  });
});

// ── Board service: placeMines validation ─────────────────────────────────
describe('placeMines validation', () => {
  it('throws when mines exceed available cells', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 0 });
    // Max mines on 5×5 = 25 - 9 = 16. Request 17.
    expect(() => placeMines(board, { rows: 5, cols: 5, mines: 17 }, 2, 2)).toThrow(
      'Too many mines'
    );
  });

  it('allows exactly max mines', () => {
    const board = createEmptyBoard({ rows: 5, cols: 5, mines: 0 });
    // 16 mines should work
    const result = placeMines(board, { rows: 5, cols: 5, mines: 16 }, 2, 2);
    const mineCount = result.flat().filter((c) => c.hasMine).length;
    expect(mineCount).toBe(16);
  });

  it('places correct number of mines', () => {
    const board = createEmptyBoard({ rows: 9, cols: 9, mines: 0 });
    const result = placeMines(board, { rows: 9, cols: 9, mines: 10 }, 4, 4);
    const mineCount = result.flat().filter((c) => c.hasMine).length;
    expect(mineCount).toBe(10);
  });
});
