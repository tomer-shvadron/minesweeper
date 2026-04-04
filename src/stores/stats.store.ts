import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import { STORAGE_KEYS } from '@/constants/storage.constants';
import { createSafeMerge } from '@/stores/persist-helpers';
import { safeStorage } from '@/stores/safe-storage';
import type { BoardKey } from '@/types/game.types';
import type { GameRecord } from '@/types/stats.types';

const MAX_RECORDS = 200;

function getBoardDimensions(boardKey: BoardKey): { rows: number; cols: number } | null {
  const preset = DIFFICULTY_PRESETS[boardKey as keyof typeof DIFFICULTY_PRESETS];
  if (preset) {
    return { rows: preset.rows, cols: preset.cols };
  }
  // Custom key format: {cols}x{rows}x{mines}
  const parts = boardKey.split('x');
  if (parts.length === 3) {
    const cols = parseInt(parts[0] ?? '0', 10);
    const rows = parseInt(parts[1] ?? '0', 10);
    if (cols > 0 && rows > 0) {
      return { rows, cols };
    }
  }
  return null;
}

/** Aggregated statistics for a single board key, computed in a single pass. */
export interface BoardStats {
  totalGames: number;
  wins: number;
  winRate: number;
  averageTime: number | null;
  bestTime: number | null;
  currentStreak: number;
  bestStreak: number;
  totalTimePlayed: number;
}

/** Compute all stats for a board key in a single pass over the records array. */
function computeBoardStats(records: GameRecord[], boardKey: BoardKey): BoardStats {
  let totalGames = 0;
  let wins = 0;
  let totalWinTime = 0;
  let bestTime: number | null = null;
  let totalTimePlayed = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let streak = 0;
  let currentStreakSet = false;

  for (const record of records) {
    if (record.boardKey !== boardKey) {
      continue;
    }
    totalGames++;
    totalTimePlayed += record.timeSeconds;

    if (record.result === 'won') {
      wins++;
      totalWinTime += record.timeSeconds;
      if (bestTime === null || record.timeSeconds < bestTime) {
        bestTime = record.timeSeconds;
      }
      streak++;
      if (streak > bestStreak) {
        bestStreak = streak;
      }
    } else {
      if (!currentStreakSet) {
        currentStreak = streak;
        currentStreakSet = true;
      }
      streak = 0;
    }
  }

  // If we never hit a loss, current streak is the full streak
  if (!currentStreakSet) {
    currentStreak = streak;
  }

  return {
    totalGames,
    wins,
    winRate: totalGames > 0 ? wins / totalGames : 0,
    averageTime: wins > 0 ? totalWinTime / wins : null,
    bestTime,
    currentStreak,
    bestStreak,
    totalTimePlayed,
  };
}

function isValidPersistedStats(persisted: unknown): boolean {
  if (!persisted || typeof persisted !== 'object') {
    return false;
  }
  const s = persisted as Record<string, unknown>;
  if (s.records !== undefined && !Array.isArray(s.records)) {
    return false;
  }
  return true;
}

interface StatsState {
  records: GameRecord[];
}

interface StatsActions {
  recordGame: (record: GameRecord) => void;
  clearHistory: () => void;
  getStatsForBoard: (boardKey: BoardKey) => BoardStats;
  getFirstClickHeatmap: (boardKey: BoardKey) => number[][] | null;
  // Legacy individual accessors (delegate to single-pass)
  getWinRate: (boardKey: BoardKey) => number;
  getAverageTime: (boardKey: BoardKey) => number | null;
  getBestTime: (boardKey: BoardKey) => number | null;
  getCurrentStreak: (boardKey: BoardKey) => number;
  getBestStreak: (boardKey: BoardKey) => number;
  getTotalTimePlayed: (boardKey: BoardKey) => number;
  getAverageEfficiency: (boardKey: BoardKey) => number | null;
}

type StatsStore = StatsState & StatsActions;

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      records: [],

      recordGame: (record) => {
        set((s) => ({
          records: [record, ...s.records].slice(0, MAX_RECORDS),
        }));
      },

      clearHistory: () => set({ records: [] }),

      getStatsForBoard: (boardKey) => computeBoardStats(get().records, boardKey),

      // Legacy individual accessors — kept for backward compatibility with
      // components that only need a single stat. They delegate to the
      // single-pass function internally.
      getWinRate: (boardKey) => computeBoardStats(get().records, boardKey).winRate,
      getAverageTime: (boardKey) => computeBoardStats(get().records, boardKey).averageTime,
      getBestTime: (boardKey) => computeBoardStats(get().records, boardKey).bestTime,
      getCurrentStreak: (boardKey) => computeBoardStats(get().records, boardKey).currentStreak,
      getBestStreak: (boardKey) => computeBoardStats(get().records, boardKey).bestStreak,
      getTotalTimePlayed: (boardKey) => computeBoardStats(get().records, boardKey).totalTimePlayed,

      getAverageEfficiency: (boardKey) => {
        const wins = get().records.filter(
          (r) => r.boardKey === boardKey && r.result === 'won' && r.totalClicks > 0
        );
        if (wins.length === 0) {
          return null;
        }
        return wins.reduce((sum, r) => sum + r.efficiency, 0) / wins.length;
      },

      getFirstClickHeatmap: (boardKey) => {
        const dims = getBoardDimensions(boardKey);
        if (!dims) {
          return null;
        }
        const { rows, cols } = dims;
        const counts = Array.from({ length: rows }, () => Array(cols).fill(0) as number[]);
        const records = get().records.filter((r) => r.boardKey === boardKey);
        if (records.length === 0) {
          return null;
        }
        let max = 0;
        for (const record of records) {
          const [r, c] = record.firstClick;
          if (r >= 0 && r < rows && c >= 0 && c < cols) {
            const row = counts[r];
            if (row) {
              row[c] = (row[c] ?? 0) + 1;
              if ((row[c] ?? 0) > max) {
                max = row[c] ?? 0;
              }
            }
          }
        }
        if (max === 0) {
          return null;
        }
        return counts.map((row) => row.map((v) => v / max));
      },
    }),
    {
      name: STORAGE_KEYS.stats,
      storage: createJSONStorage(() => safeStorage),
      merge: createSafeMerge<StatsStore>(isValidPersistedStats),
    }
  )
);
