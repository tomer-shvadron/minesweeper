import type { BoardKey } from '@/types/game.types'

export interface LeaderboardEntry {
  name: string
  timeSeconds: number
  date: string // ISO date string
}

export type Leaderboard = Record<BoardKey, LeaderboardEntry[]>
