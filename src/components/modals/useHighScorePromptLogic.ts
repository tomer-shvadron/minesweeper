import { useState } from 'react'

import { useLeaderboardStore } from '@/stores/leaderboard.store'
import { useUIStore } from '@/stores/ui.store'

export const useHighScorePromptLogic = () => {
  const highScoreEntry = useUIStore((s) => s.highScoreEntry)
  const dismissHighScorePrompt = useUIStore((s) => s.dismissHighScorePrompt)
  const openLeaderboardModal = useUIStore((s) => s.openLeaderboardModal)
  const addEntry = useLeaderboardStore((s) => s.addEntry)

  const [name, setName] = useState('')

  const handleSubmit = () => {
    if (!highScoreEntry) return
    const trimmed = name.trim() || 'Anonymous'
    addEntry(highScoreEntry.boardKey, {
      name: trimmed,
      timeSeconds: highScoreEntry.timeSeconds,
      date: new Date().toISOString(),
    })
    dismissHighScorePrompt()
    setName('')
    openLeaderboardModal()
  }

  const handleDismiss = () => {
    dismissHighScorePrompt()
    setName('')
  }

  return {
    isOpen: highScoreEntry !== null,
    timeSeconds: highScoreEntry?.timeSeconds ?? 0,
    name,
    setName,
    handleSubmit,
    handleDismiss,
  }
}
