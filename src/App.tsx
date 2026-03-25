import { useEffect } from 'react'

import { GameBoard } from '@/components/board/GameBoard'
import { Header } from '@/components/header/Header'
import { HighScorePrompt } from '@/components/modals/HighScorePrompt'
import { LeaderboardModal } from '@/components/modals/LeaderboardModal'
import { NewGameModal } from '@/components/modals/NewGameModal'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { createBoardKey } from '@/services/board.service'
import { useGameStore } from '@/stores/game.store'
import { useLeaderboardStore } from '@/stores/leaderboard.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUIStore } from '@/stores/ui.store'

export const App = () => {
  const theme = useSettingsStore((s) => s.theme)
  const status = useGameStore((s) => s.status)
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds)
  const config = useGameStore((s) => s.config)
  const isHighScore = useLeaderboardStore((s) => s.isHighScore)
  const showHighScorePrompt = useUIStore((s) => s.showHighScorePrompt)

  // Apply theme to <body> so CSS variables cascade to all components
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  // Watch for win → trigger high-score prompt if applicable
  useEffect(() => {
    if (status === 'won') {
      const boardKey = createBoardKey(config)
      if (isHighScore(boardKey, elapsedSeconds)) {
        showHighScorePrompt({ boardKey, timeSeconds: elapsedSeconds })
      }
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      {/* Inline-flex column so Header and GameBoard share the same width naturally */}
      <div className="game-window">
        <Header />
        <GameBoard />
      </div>

      {/* Modals rendered via React Portal (outside game-window) */}
      <NewGameModal />
      <SettingsModal />
      <LeaderboardModal />
      <HighScorePrompt />
    </div>
  )
}
