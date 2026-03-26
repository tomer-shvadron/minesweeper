import { useState } from 'react'

import { createBoardKey } from '@/services/board.service'
import { useGameStore } from '@/stores/game.store'
import { useLeaderboardStore } from '@/stores/leaderboard.store'
import { useUIStore } from '@/stores/ui.store'
import type { BoardKey } from '@/types/game.types'

const PRESET_KEYS: BoardKey[] = ['beginner', 'intermediate', 'expert']

export const useLeaderboardModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeLeaderboardModal)
  const allEntries = useLeaderboardStore((s) => s.entries)
  const allGamesPlayed = useLeaderboardStore((s) => s.gamesPlayed)
  const config = useGameStore((s) => s.config)

  const currentBoardKey = createBoardKey(config)

  // Collect all board keys that have at least one entry
  const customKeysWithScores = Object.keys(allEntries).filter(
    (k): k is BoardKey =>
      !PRESET_KEYS.includes(k as BoardKey) && (allEntries[k as BoardKey]?.length ?? 0) > 0
  )

  const allTabs: BoardKey[] = [...PRESET_KEYS, ...customKeysWithScores]

  // Default to current board's tab, falling back to beginner
  const [selectedTab, setSelectedTab] = useState<BoardKey>(() =>
    allTabs.includes(currentBoardKey) ? currentBoardKey : 'beginner'
  )

  const entries = allEntries[selectedTab] ?? []
  const gamesPlayedCount = allGamesPlayed[selectedTab] ?? 0

  const clearScores = () =>
    useLeaderboardStore.setState((prev) => {
      const { [selectedTab]: _removed, ...rest } = prev.entries
      void _removed
      return { entries: rest }
    })

  return {
    allTabs,
    selectedTab,
    setSelectedTab,
    entries,
    gamesPlayedCount,
    clearScores,
    closeModal,
  }
}
