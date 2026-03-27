import type { BoardKey } from '@/types/game.types'

export interface GameRecord {
  id: string
  boardKey: BoardKey
  result: 'won' | 'lost'
  timeSeconds: number
  date: string // ISO 8601
  firstClick: [number, number]
  totalClicks: number
  cellsRevealed: number
  minesFlagged: number
  efficiency: number // cellsRevealed / totalClicks (0 if no clicks)
}
