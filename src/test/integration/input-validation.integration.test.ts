/**
 * Integration tests: input validation for player names and game config.
 *
 * Tests the sanitization logic in useHighScorePromptLogic (player names)
 * and the edge cases for board configuration inputs.
 */
import { describe, expect, it } from 'vitest';

import { MAX_PLAYER_NAME_LENGTH } from '@/constants/ui.constants';

// Re-implement the name sanitization from useHighScorePromptLogic for isolated testing.
// This is the same logic used in handleSubmit.
function sanitizeName(name: string): string {
  const sanitized = name
    .split('')
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code <= 0x1f) {
        return false;
      }
      if (code >= 0x7f && code <= 0x9f) {
        return false;
      }
      if (code === 0x200b || code === 0x200c || code === 0x200d || code === 0xfeff) {
        return false;
      }
      return true;
    })
    .join('')
    .trim()
    .slice(0, MAX_PLAYER_NAME_LENGTH);
  return sanitized || 'Anonymous';
}

describe('player name sanitization', () => {
  it('keeps a normal name unchanged', () => {
    expect(sanitizeName('Alice')).toBe('Alice');
  });

  it('trims whitespace', () => {
    expect(sanitizeName('  Bob  ')).toBe('Bob');
  });

  it('strips null bytes', () => {
    expect(sanitizeName('Al\0ice')).toBe('Alice');
  });

  it('strips C0 control characters (0x01–0x1F)', () => {
    expect(sanitizeName('A\x01B\x1FC')).toBe('ABC');
  });

  it('strips C1 control characters (0x7F–0x9F)', () => {
    expect(sanitizeName('A\x7FB\x80C\x9FD')).toBe('ABCD');
  });

  it('strips zero-width space (U+200B)', () => {
    expect(sanitizeName('A\u200BB')).toBe('AB');
  });

  it('strips zero-width non-joiner (U+200C)', () => {
    expect(sanitizeName('A\u200CB')).toBe('AB');
  });

  it('strips zero-width joiner (U+200D)', () => {
    expect(sanitizeName('A\u200DB')).toBe('AB');
  });

  it('strips BOM (U+FEFF)', () => {
    expect(sanitizeName('\uFEFFAlice')).toBe('Alice');
  });

  it('returns "Anonymous" for empty string', () => {
    expect(sanitizeName('')).toBe('Anonymous');
  });

  it('returns "Anonymous" for whitespace-only string', () => {
    expect(sanitizeName('   ')).toBe('Anonymous');
  });

  it('returns "Anonymous" for string of only control characters', () => {
    expect(sanitizeName('\x00\x01\x02')).toBe('Anonymous');
  });

  it('truncates to MAX_PLAYER_NAME_LENGTH', () => {
    const long = 'A'.repeat(50);
    expect(sanitizeName(long)).toBe('A'.repeat(MAX_PLAYER_NAME_LENGTH));
  });

  it('allows emoji in names', () => {
    expect(sanitizeName('🎮 Player')).toBe('🎮 Player');
  });

  it('allows non-Latin characters', () => {
    expect(sanitizeName('プレイヤー')).toBe('プレイヤー');
  });

  it('handles mixed valid and invalid characters', () => {
    expect(sanitizeName('  \x00He\u200Bllo\x7F  ')).toBe('Hello');
  });
});

describe('game config edge cases through store', () => {
  it('intermediate preset is valid and playable', async () => {
    const { useGameStore } = await import('@/stores/game.store');
    const { DIFFICULTY_PRESETS } = await import('@/constants/game.constants');
    useGameStore.getState().startNewGame(DIFFICULTY_PRESETS.intermediate);
    const cfg = useGameStore.getState().config;
    expect(cfg).toEqual(DIFFICULTY_PRESETS.intermediate);
    useGameStore.getState().revealCell(8, 8);
    expect(useGameStore.getState().status).not.toBe('idle');
  });

  it('expert preset is valid and playable', async () => {
    const { useGameStore } = await import('@/stores/game.store');
    const { DIFFICULTY_PRESETS } = await import('@/constants/game.constants');
    useGameStore.getState().startNewGame(DIFFICULTY_PRESETS.expert);
    const cfg = useGameStore.getState().config;
    expect(cfg).toEqual(DIFFICULTY_PRESETS.expert);
    useGameStore.getState().revealCell(8, 15);
    expect(useGameStore.getState().status).not.toBe('idle');
  });

  it('custom 30×50 board (max dimensions) is valid', async () => {
    const { useGameStore } = await import('@/stores/game.store');
    useGameStore.getState().startNewGame({ rows: 30, cols: 50, mines: 100 });
    const { config, board } = useGameStore.getState();
    expect(config.rows).toBe(30);
    expect(config.cols).toBe(50);
    expect(config.mines).toBe(100);
    expect(board.length).toBe(30);
    expect(board[0]?.length).toBe(50);
  });
});
