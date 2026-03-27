import { beforeEach, describe, expect, it } from 'vitest'

import { useStatsStore } from '@/stores/stats.store'
import type { GameRecord } from '@/types/stats.types'

function makeRecord(
  overrides: Partial<GameRecord> & { boardKey: string; result: 'won' | 'lost' }
): GameRecord {
  return {
    id: crypto.randomUUID(),
    timeSeconds: 60,
    date: new Date().toISOString(),
    firstClick: [0, 0],
    totalClicks: 10,
    cellsRevealed: 50,
    minesFlagged: 5,
    efficiency: 5,
    ...overrides,
  }
}

beforeEach(() => {
  useStatsStore.setState({ records: [] })
})

describe('recordGame', () => {
  it('adds a record', () => {
    const record = makeRecord({ boardKey: 'beginner', result: 'won' })
    useStatsStore.getState().recordGame(record)
    expect(useStatsStore.getState().records).toHaveLength(1)
    expect(useStatsStore.getState().records[0]).toEqual(record)
  })

  it('prepends records (newest first)', () => {
    const first = makeRecord({ boardKey: 'beginner', result: 'won', timeSeconds: 30 })
    const second = makeRecord({ boardKey: 'beginner', result: 'lost', timeSeconds: 10 })
    useStatsStore.getState().recordGame(first)
    useStatsStore.getState().recordGame(second)
    expect(useStatsStore.getState().records[0]).toEqual(second)
    expect(useStatsStore.getState().records[1]).toEqual(first)
  })

  it('caps at 200 records', () => {
    for (let i = 0; i < 205; i++) {
      useStatsStore.getState().recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    }
    expect(useStatsStore.getState().records).toHaveLength(200)
  })
})

describe('clearHistory', () => {
  it('removes all records', () => {
    useStatsStore.getState().recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    useStatsStore.getState().clearHistory()
    expect(useStatsStore.getState().records).toHaveLength(0)
  })
})

describe('getWinRate', () => {
  it('returns 0 for no records', () => {
    expect(useStatsStore.getState().getWinRate('beginner')).toBe(0)
  })

  it('calculates win rate correctly', () => {
    const store = useStatsStore.getState()
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'lost' }))
    expect(useStatsStore.getState().getWinRate('beginner')).toBeCloseTo(2 / 3)
  })

  it('ignores other board keys', () => {
    useStatsStore.getState().recordGame(makeRecord({ boardKey: 'intermediate', result: 'won' }))
    expect(useStatsStore.getState().getWinRate('beginner')).toBe(0)
  })
})

describe('getBestTime', () => {
  it('returns null for no wins', () => {
    useStatsStore.getState().recordGame(makeRecord({ boardKey: 'beginner', result: 'lost' }))
    expect(useStatsStore.getState().getBestTime('beginner')).toBeNull()
  })

  it('returns minimum win time', () => {
    const store = useStatsStore.getState()
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', timeSeconds: 120 }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', timeSeconds: 45 }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', timeSeconds: 80 }))
    expect(useStatsStore.getState().getBestTime('beginner')).toBe(45)
  })
})

describe('getAverageTime', () => {
  it('returns null for no wins', () => {
    expect(useStatsStore.getState().getAverageTime('beginner')).toBeNull()
  })

  it('averages win times', () => {
    const store = useStatsStore.getState()
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', timeSeconds: 40 }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', timeSeconds: 60 }))
    expect(useStatsStore.getState().getAverageTime('beginner')).toBe(50)
  })
})

describe('getCurrentStreak', () => {
  it('returns 0 for no records', () => {
    expect(useStatsStore.getState().getCurrentStreak('beginner')).toBe(0)
  })

  it('counts consecutive wins from most recent', () => {
    const store = useStatsStore.getState()
    // Added oldest-to-newest, but store prepends so newest-first
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'lost' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    // records in store: [won, won, lost]
    expect(useStatsStore.getState().getCurrentStreak('beginner')).toBe(2)
  })

  it('returns 0 if most recent is a loss', () => {
    const store = useStatsStore.getState()
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'lost' }))
    expect(useStatsStore.getState().getCurrentStreak('beginner')).toBe(0)
  })
})

describe('getBestStreak', () => {
  it('finds the longest consecutive win run', () => {
    const store = useStatsStore.getState()
    // Inserted newest-first so the store holds them in this order
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'lost' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'lost' }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won' }))
    // store records (newest first): [won, lost, won, won, won, lost]
    // streaks: 1, break, 3, break → best = 3
    expect(useStatsStore.getState().getBestStreak('beginner')).toBe(3)
  })
})

describe('getFirstClickHeatmap', () => {
  it('returns null for no records', () => {
    expect(useStatsStore.getState().getFirstClickHeatmap('beginner')).toBeNull()
  })

  it('returns normalized heatmap', () => {
    const store = useStatsStore.getState()
    // beginner = 9x9; click [0,0] twice, [1,1] once
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', firstClick: [0, 0] }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', firstClick: [0, 0] }))
    store.recordGame(makeRecord({ boardKey: 'beginner', result: 'won', firstClick: [1, 1] }))
    const heatmap = useStatsStore.getState().getFirstClickHeatmap('beginner')
    expect(heatmap).not.toBeNull()
    expect(heatmap?.[0]?.[0]).toBe(1) // 2/2 = 1 (max)
    expect(heatmap?.[1]?.[1]).toBe(0.5) // 1/2 = 0.5
    expect(heatmap?.[2]?.[2]).toBe(0) // 0/2 = 0
  })
})
