import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import { STORAGE_KEYS } from '@/constants/storage.constants';
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

interface StatsState {
  records: GameRecord[];
}

interface StatsActions {
  recordGame: (record: GameRecord) => void;
  clearHistory: () => void;
  getWinRate: (boardKey: BoardKey) => number;
  getAverageTime: (boardKey: BoardKey) => number | null;
  getBestTime: (boardKey: BoardKey) => number | null;
  getCurrentStreak: (boardKey: BoardKey) => number;
  getBestStreak: (boardKey: BoardKey) => number;
  getTotalTimePlayed: (boardKey: BoardKey) => number;
  getAverageEfficiency: (boardKey: BoardKey) => number | null;
  getFirstClickHeatmap: (boardKey: BoardKey) => number[][] | null;
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

      getWinRate: (boardKey) => {
        const records = get().records.filter((r) => r.boardKey === boardKey);
        if (records.length === 0) {
          return 0;
        }
        const wins = records.filter((r) => r.result === 'won').length;
        return wins / records.length;
      },

      getAverageTime: (boardKey) => {
        const wins = get().records.filter((r) => r.boardKey === boardKey && r.result === 'won');
        if (wins.length === 0) {
          return null;
        }
        return wins.reduce((sum, r) => sum + r.timeSeconds, 0) / wins.length;
      },

      getBestTime: (boardKey) => {
        const wins = get().records.filter((r) => r.boardKey === boardKey && r.result === 'won');
        if (wins.length === 0) {
          return null;
        }
        return Math.min(...wins.map((r) => r.timeSeconds));
      },

      getCurrentStreak: (boardKey) => {
        const records = get().records.filter((r) => r.boardKey === boardKey);
        let streak = 0;
        for (const record of records) {
          if (record.result === 'won') {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },

      getBestStreak: (boardKey) => {
        const records = get().records.filter((r) => r.boardKey === boardKey);
        let best = 0;
        let current = 0;
        for (const record of records) {
          if (record.result === 'won') {
            current++;
            if (current > best) {
              best = current;
            }
          } else {
            current = 0;
          }
        }
        return best;
      },

      getTotalTimePlayed: (boardKey) => {
        return get()
          .records.filter((r) => r.boardKey === boardKey)
          .reduce((sum, r) => sum + r.timeSeconds, 0);
      },

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
    { name: STORAGE_KEYS.stats }
  )
);
