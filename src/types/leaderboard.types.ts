import type { BoardKey } from '@/types/game.types';

export interface LeaderboardEntry {
  name: string;
  timeSeconds: number;
  date: string; // ISO date string
}

export type Leaderboard = Record<BoardKey, LeaderboardEntry[]>;

/** Data for a pending high score name prompt (after a winning game). */
export interface HighScoreEntry {
  timeSeconds: number;
  boardKey: BoardKey;
}
