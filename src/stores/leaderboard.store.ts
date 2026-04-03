import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants/storage.constants';
import { safeStorage } from '@/stores/safe-storage';
import type { BoardKey } from '@/types/game.types';
import type { Leaderboard, LeaderboardEntry } from '@/types/leaderboard.types';

const MAX_ENTRIES = 10;

function isValidEntry(e: unknown): e is LeaderboardEntry {
  if (!e || typeof e !== 'object') {
    return false;
  }
  const entry = e as Record<string, unknown>;
  return (
    typeof entry.name === 'string' &&
    typeof entry.timeSeconds === 'number' &&
    Number.isFinite(entry.timeSeconds) &&
    entry.timeSeconds >= 0 &&
    typeof entry.date === 'string'
  );
}

function isValidPersistedLeaderboard(persisted: unknown): boolean {
  if (!persisted || typeof persisted !== 'object') {
    return false;
  }
  const s = persisted as Record<string, unknown>;

  if (s.entries !== undefined && typeof s.entries !== 'object') {
    return false;
  }

  // Validate that entries contain valid data
  if (s.entries && typeof s.entries === 'object') {
    for (const entries of Object.values(s.entries as Record<string, unknown>)) {
      if (!Array.isArray(entries)) {
        return false;
      }
      for (const entry of entries) {
        if (!isValidEntry(entry)) {
          return false;
        }
      }
    }
  }

  return true;
}

interface LeaderboardStore {
  entries: Partial<Leaderboard>;
  gamesPlayed: Partial<Record<BoardKey, number>>;
  lastPlayerName: string;
  addEntry: (boardKey: BoardKey, entry: LeaderboardEntry) => void;
  getTopEntries: (boardKey: BoardKey) => LeaderboardEntry[];
  isHighScore: (boardKey: BoardKey, timeSeconds: number) => boolean;
  incrementGamesPlayed: (boardKey: BoardKey) => void;
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      entries: {},
      gamesPlayed: {},
      lastPlayerName: '',

      addEntry: (boardKey, entry) => {
        const current = get().entries[boardKey] ?? [];
        const updated = [...current, entry]
          .sort((a, b) => a.timeSeconds - b.timeSeconds)
          .slice(0, MAX_ENTRIES);
        set((s) => ({
          entries: { ...s.entries, [boardKey]: updated },
          lastPlayerName: entry.name,
        }));
      },

      getTopEntries: (boardKey) => get().entries[boardKey] ?? [],

      isHighScore: (boardKey, timeSeconds) => {
        const entries = get().entries[boardKey] ?? [];
        if (entries.length === 0) {
          return true;
        }
        const worst = entries[entries.length - 1];
        // Strictly lower than the worst existing time (not equal)
        return worst !== undefined && timeSeconds < worst.timeSeconds;
      },

      incrementGamesPlayed: (boardKey) => {
        set((s) => ({
          gamesPlayed: {
            ...s.gamesPlayed,
            [boardKey]: (s.gamesPlayed[boardKey] ?? 0) + 1,
          },
        }));
      },
    }),
    {
      name: STORAGE_KEYS.leaderboard,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        entries: s.entries,
        gamesPlayed: s.gamesPlayed,
        lastPlayerName: s.lastPlayerName,
      }),
      merge: (persisted, current) => {
        if (!isValidPersistedLeaderboard(persisted)) {
          return current;
        }
        return { ...current, ...(persisted as object) };
      },
    }
  )
);
