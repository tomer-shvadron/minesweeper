/**
 * Integration tests: corrupted localStorage hydration.
 *
 * Validates that all stores with persist middleware gracefully fallback
 * when localStorage contains invalid/corrupted data.
 */
import { describe, expect, it } from 'vitest';

import { STORAGE_KEYS } from '@/constants/storage.constants';

describe('corrupted localStorage hydration', () => {
  // We test the merge functions by importing and calling the store's persist
  // merge logic directly. Since Zustand's merge function receives persisted
  // data and a current state, we can test the validation boundary.

  describe('game store merge validation', () => {
    it('rejects null persisted state', async () => {
      localStorage.setItem(STORAGE_KEYS.game, JSON.stringify({ state: null, version: 0 }));
      // Re-import store to trigger hydration
      const { useGameStore } = await import('@/stores/game.store');
      // Access the merge function through persist options
      const options = (
        useGameStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { status: 'idle', config: { rows: 9, cols: 9, mines: 10 } };
      const result = options.merge?.(null, current);
      expect(result).toBe(current);
    });

    it('rejects persisted state with invalid status', async () => {
      const { useGameStore } = await import('@/stores/game.store');
      const options = (
        useGameStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { status: 'idle' };
      const corrupted = {
        status: 'INVALID_STATUS',
        config: { rows: 9, cols: 9, mines: 10 },
        board: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({}))),
        elapsedSeconds: 0,
      };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted state with NaN config values', async () => {
      const { useGameStore } = await import('@/stores/game.store');
      const options = (
        useGameStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { status: 'idle' };
      const corrupted = {
        status: 'playing',
        config: { rows: NaN, cols: 9, mines: 10 },
        board: [],
        elapsedSeconds: 0,
      };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted state with mismatched board dimensions', async () => {
      const { useGameStore } = await import('@/stores/game.store');
      const options = (
        useGameStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { status: 'idle' };
      const corrupted = {
        status: 'playing',
        config: { rows: 9, cols: 9, mines: 10 },
        board: [[{}]], // 1×1 board doesn't match 9×9 config
        elapsedSeconds: 0,
      };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted state with negative elapsedSeconds', async () => {
      const { useGameStore } = await import('@/stores/game.store');
      const options = (
        useGameStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { status: 'idle' };
      const corrupted = {
        status: 'playing',
        config: { rows: 9, cols: 9, mines: 10 },
        board: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({}))),
        elapsedSeconds: -5,
      };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('accepts valid persisted state', async () => {
      const { useGameStore } = await import('@/stores/game.store');
      const options = (
        useGameStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { status: 'idle' };
      const valid = {
        status: 'playing',
        config: { rows: 9, cols: 9, mines: 10 },
        board: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => ({}))),
        elapsedSeconds: 42,
        isFirstClick: false,
        unrevealedSafeCount: 50,
      };
      const result = options.merge?.(valid, current) as Record<string, unknown>;
      expect(result).not.toBe(current);
      expect(result.status).toBe('playing');
      expect(result.elapsedSeconds).toBe(42);
    });
  });

  describe('settings store merge validation', () => {
    it('rejects persisted settings with invalid theme', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { theme: 'light' };
      const corrupted = { theme: 'NONEXISTENT_THEME' };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted settings with invalid flagMode', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { flagMode: 'flags-only' };
      const corrupted = { flagMode: 'invalid-mode' };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted settings with out-of-range volume', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { volume: 0.5 };
      const corrupted = { volume: 5.0 };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted settings with NaN volume', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { volume: 0.5 };
      const corrupted = { volume: NaN };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted settings with non-boolean soundEnabled', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { soundEnabled: true };
      const corrupted = { soundEnabled: 'yes' };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('accepts valid persisted settings', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { theme: 'light', volume: 0.5 };
      const valid = { theme: 'jedi', volume: 0.8, soundEnabled: false };
      const result = options.merge?.(valid, current) as Record<string, unknown>;
      expect(result).not.toBe(current);
      expect(result.theme).toBe('jedi');
      expect(result.volume).toBe(0.8);
    });

    it('migrates legacy V3 theme "xp" to "light"', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { theme: 'light' };
      const legacy = { theme: 'xp', volume: 0.7 };
      const result = options.merge?.(legacy, current) as Record<string, unknown>;
      expect(result).not.toBe(current);
      expect(result.theme).toBe('light');
      expect(result.volume).toBe(0.7);
    });

    it('migrates legacy V3 theme "dark" to "dark"', async () => {
      const { useSettingsStore } = await import('@/stores/settings.store');
      const options = (
        useSettingsStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { theme: 'light' };
      const legacy = { theme: 'dark' };
      const result = options.merge?.(legacy, current) as Record<string, unknown>;
      expect(result).not.toBe(current);
      expect(result.theme).toBe('dark');
    });
  });

  describe('leaderboard store merge validation', () => {
    it('rejects persisted leaderboard with non-array entries value', async () => {
      const { useLeaderboardStore } = await import('@/stores/leaderboard.store');
      const options = (
        useLeaderboardStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { entries: {} };
      const corrupted = { entries: { beginner: 'not-an-array' } };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted leaderboard with invalid entry (missing name)', async () => {
      const { useLeaderboardStore } = await import('@/stores/leaderboard.store');
      const options = (
        useLeaderboardStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { entries: {} };
      const corrupted = {
        entries: {
          beginner: [{ timeSeconds: 42, date: '2026-01-01' }], // missing name
        },
      };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('rejects persisted leaderboard with non-finite timeSeconds', async () => {
      const { useLeaderboardStore } = await import('@/stores/leaderboard.store');
      const options = (
        useLeaderboardStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { entries: {} };
      const corrupted = {
        entries: {
          beginner: [{ name: 'Alice', timeSeconds: Infinity, date: '2026-01-01' }],
        },
      };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('accepts persisted leaderboard with zero timeSeconds (instant win)', async () => {
      const { useLeaderboardStore } = await import('@/stores/leaderboard.store');
      const options = (
        useLeaderboardStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { entries: {} };
      const valid = {
        entries: {
          beginner: [{ name: 'Alice', timeSeconds: 0, date: '2026-01-01' }],
        },
      };
      const result = options.merge?.(valid, current);
      expect(result).not.toBe(current);
    });

    it('rejects persisted leaderboard with negative timeSeconds', async () => {
      const { useLeaderboardStore } = await import('@/stores/leaderboard.store');
      const options = (
        useLeaderboardStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { entries: {} };
      const corrupted = {
        entries: {
          beginner: [{ name: 'Alice', timeSeconds: -10, date: '2026-01-01' }],
        },
      };
      const result = options.merge?.(corrupted, current);
      expect(result).toBe(current);
    });

    it('accepts valid persisted leaderboard', async () => {
      const { useLeaderboardStore } = await import('@/stores/leaderboard.store');
      const options = (
        useLeaderboardStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { entries: {} };
      const valid = {
        entries: {
          beginner: [{ name: 'Alice', timeSeconds: 42, date: '2026-01-01T00:00:00.000Z' }],
        },
        gamesPlayed: { beginner: 5 },
        lastPlayerName: 'Alice',
      };
      const result = options.merge?.(valid, current) as Record<string, unknown>;
      expect(result).not.toBe(current);
    });

    it('accepts empty entries object as valid', async () => {
      const { useLeaderboardStore } = await import('@/stores/leaderboard.store');
      const options = (
        useLeaderboardStore as unknown as {
          persist: { getOptions: () => { merge?: (p: unknown, c: unknown) => unknown } };
        }
      ).persist.getOptions();
      const current = { entries: {} };
      const valid = { entries: {} };
      const result = options.merge?.(valid, current) as Record<string, unknown>;
      expect(result).not.toBe(current);
    });
  });
});
