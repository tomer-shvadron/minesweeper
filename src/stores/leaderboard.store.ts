import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { BoardKey } from '@/types/game.types'
import type { Leaderboard, LeaderboardEntry } from '@/types/leaderboard.types'

const MAX_ENTRIES = 10

interface LeaderboardStore {
  entries: Partial<Leaderboard>
  addEntry: (boardKey: BoardKey, entry: LeaderboardEntry) => void
  getTopEntries: (boardKey: BoardKey) => LeaderboardEntry[]
  isHighScore: (boardKey: BoardKey, timeSeconds: number) => boolean
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      entries: {},

      addEntry: (boardKey, entry) => {
        const current = get().entries[boardKey] ?? []
        const updated = [...current, entry]
          .sort((a, b) => a.timeSeconds - b.timeSeconds)
          .slice(0, MAX_ENTRIES)
        set((s) => ({ entries: { ...s.entries, [boardKey]: updated } }))
      },

      getTopEntries: (boardKey) => get().entries[boardKey] ?? [],

      isHighScore: (boardKey, timeSeconds) => {
        const entries = get().entries[boardKey] ?? []
        if (entries.length < MAX_ENTRIES) {
          return true
        }
        const worst = entries[entries.length - 1]
        return worst !== undefined && timeSeconds < worst.timeSeconds
      },
    }),
    { name: 'minesweeper-leaderboard' }
  )
)
