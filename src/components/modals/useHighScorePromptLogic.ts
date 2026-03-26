import { useState } from 'react'

import { useLeaderboardStore } from '@/stores/leaderboard.store'
import { useUIStore } from '@/stores/ui.store'

export const useHighScorePromptLogic = () => {
  const highScoreEntry = useUIStore((s) => s.highScoreEntry)
  const dismissHighScorePrompt = useUIStore((s) => s.dismissHighScorePrompt)
  const openLeaderboardModal = useUIStore((s) => s.openLeaderboardModal)
  const addEntry = useLeaderboardStore((s) => s.addEntry)
  const lastPlayerName = useLeaderboardStore((s) => s.lastPlayerName)

  // Initialise from the persisted last-used name so the field is pre-filled on first open.
  // We preserve the value in state across opens so subsequent prompts are also pre-filled.
  const [name, setName] = useState(lastPlayerName)

  const handleSubmit = () => {
    if (!highScoreEntry) {
      return
    }
    const trimmed = name.trim() || 'Anonymous'
    addEntry(highScoreEntry.boardKey, {
      name: trimmed,
      timeSeconds: highScoreEntry.timeSeconds,
      date: new Date().toISOString(),
    })
    // Keep the submitted name in local state so the next prompt is pre-filled
    setName(trimmed)
    dismissHighScorePrompt()
    openLeaderboardModal()
  }

  const handleDismiss = () => {
    // Preserve current name for next time — don't clear it
    dismissHighScorePrompt()
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
