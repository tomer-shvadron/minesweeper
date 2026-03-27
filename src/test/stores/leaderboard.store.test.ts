import { beforeEach, describe, expect, it } from 'vitest';

import { useLeaderboardStore } from '@/stores/leaderboard.store';
import type { LeaderboardEntry } from '@/types/leaderboard.types';

function entry(timeSeconds: number, name = 'Player'): LeaderboardEntry {
  return { name, timeSeconds, date: new Date().toISOString() };
}

beforeEach(() => {
  useLeaderboardStore.setState({ entries: {} });
});

describe('leaderboard.store', () => {
  // ----------------------------------------------------------------
  describe('addEntry', () => {
    it('adds the first entry for a board key', () => {
      useLeaderboardStore.getState().addEntry('beginner', entry(120));
      expect(useLeaderboardStore.getState().entries.beginner).toHaveLength(1);
    });

    it('sorts entries by timeSeconds ascending', () => {
      useLeaderboardStore.getState().addEntry('beginner', entry(300, 'Slow'));
      useLeaderboardStore.getState().addEntry('beginner', entry(60, 'Fast'));
      useLeaderboardStore.getState().addEntry('beginner', entry(120, 'Mid'));
      const times = (useLeaderboardStore.getState().entries.beginner ?? []).map(
        (e) => e.timeSeconds
      );
      expect(times).toEqual([60, 120, 300]);
    });

    it('keeps at most 10 entries, dropping the slowest', () => {
      for (let i = 1; i <= 12; i++) {
        useLeaderboardStore.getState().addEntry('beginner', entry(i * 10));
      }
      const entries = useLeaderboardStore.getState().entries.beginner ?? [];
      expect(entries).toHaveLength(10);
      expect(entries[0]?.timeSeconds).toBe(10);
      expect(entries[9]?.timeSeconds).toBe(100);
    });

    it('works independently for different board keys', () => {
      useLeaderboardStore.getState().addEntry('beginner', entry(60));
      useLeaderboardStore.getState().addEntry('expert', entry(500));
      expect(useLeaderboardStore.getState().entries.beginner).toHaveLength(1);
      expect(useLeaderboardStore.getState().entries.expert).toHaveLength(1);
    });

    it('preserves the entry name and date', () => {
      const e = { name: 'Alice', timeSeconds: 42, date: '2026-01-01T00:00:00.000Z' };
      useLeaderboardStore.getState().addEntry('beginner', e);
      const stored = useLeaderboardStore.getState().entries.beginner?.[0];
      expect(stored?.name).toBe('Alice');
      expect(stored?.date).toBe('2026-01-01T00:00:00.000Z');
    });

    it('handles entries with equal time — both are kept', () => {
      useLeaderboardStore.getState().addEntry('beginner', entry(60, 'A'));
      useLeaderboardStore.getState().addEntry('beginner', entry(60, 'B'));
      expect(useLeaderboardStore.getState().entries.beginner).toHaveLength(2);
    });
  });

  // ----------------------------------------------------------------
  describe('getTopEntries', () => {
    it('returns an empty array for an unknown board key', () => {
      expect(useLeaderboardStore.getState().getTopEntries('beginner')).toEqual([]);
    });

    it('returns the entries for a known board key', () => {
      useLeaderboardStore.getState().addEntry('beginner', entry(42));
      const result = useLeaderboardStore.getState().getTopEntries('beginner');
      expect(result).toHaveLength(1);
      expect(result[0]?.timeSeconds).toBe(42);
    });

    it('returns entries in sorted order (fastest first)', () => {
      useLeaderboardStore.getState().addEntry('intermediate', entry(200));
      useLeaderboardStore.getState().addEntry('intermediate', entry(50));
      const times = useLeaderboardStore
        .getState()
        .getTopEntries('intermediate')
        .map((e) => e.timeSeconds);
      expect(times).toEqual([50, 200]);
    });
  });

  // ----------------------------------------------------------------
  describe('isHighScore', () => {
    it('returns true when there are fewer than 10 entries', () => {
      for (let i = 0; i < 9; i++) {
        useLeaderboardStore.getState().addEntry('beginner', entry((i + 1) * 10));
      }
      expect(useLeaderboardStore.getState().isHighScore('beginner', 999)).toBe(true);
    });

    it('returns true when there are no entries yet', () => {
      expect(useLeaderboardStore.getState().isHighScore('beginner', 1)).toBe(true);
    });

    it('returns true when the new time beats the 10th-place time', () => {
      for (let i = 1; i <= 10; i++) {
        useLeaderboardStore.getState().addEntry('beginner', entry(i * 100));
      }
      // Worst entry is 1000s; new time 999 < 1000 → high score
      expect(useLeaderboardStore.getState().isHighScore('beginner', 999)).toBe(true);
    });

    it('returns false when the new time equals the 10th-place time (strict <)', () => {
      for (let i = 1; i <= 10; i++) {
        useLeaderboardStore.getState().addEntry('beginner', entry(i * 100));
      }
      // Worst is 1000; new time exactly 1000 → NOT a high score (not strictly less)
      expect(useLeaderboardStore.getState().isHighScore('beginner', 1000)).toBe(false);
    });

    it('returns false when the new time is slower than 10th place', () => {
      for (let i = 1; i <= 10; i++) {
        useLeaderboardStore.getState().addEntry('beginner', entry(i * 10));
      }
      expect(useLeaderboardStore.getState().isHighScore('beginner', 200)).toBe(false);
    });

    it('works independently for different board keys', () => {
      for (let i = 1; i <= 10; i++) {
        useLeaderboardStore.getState().addEntry('beginner', entry(i * 10));
      }
      // expert has no entries → always a high score
      expect(useLeaderboardStore.getState().isHighScore('expert', 9999)).toBe(true);
    });
  });
});
