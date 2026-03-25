import { useEffect } from 'react'

import { GameBoard } from '@/components/board/GameBoard'
import { Header } from '@/components/header/Header'
import { HighScorePrompt } from '@/components/modals/HighScorePrompt'
import { LeaderboardModal } from '@/components/modals/LeaderboardModal'
import { NewGameModal } from '@/components/modals/NewGameModal'
import { ResumePrompt } from '@/components/modals/ResumePrompt'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { createBoardKey } from '@/services/board.service'
import { playSound } from '@/services/sound.service'
import { useGameStore } from '@/stores/game.store'
import { useLeaderboardStore } from '@/stores/leaderboard.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUIStore } from '@/stores/ui.store'

export const App = () => {
  const theme = useSettingsStore((s) => s.theme)
  const status = useGameStore((s) => s.status)
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds)
  const config = useGameStore((s) => s.config)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const volume = useSettingsStore((s) => s.volume)
  const isHighScore = useLeaderboardStore((s) => s.isHighScore)
  const showHighScorePrompt = useUIStore((s) => s.showHighScorePrompt)
  const openResumePrompt = useUIStore((s) => s.openResumePrompt)

  // Apply theme to <body> so CSS variables cascade to all components
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  // On first mount: prompt to resume if there's a saved in-progress game
  useEffect(() => {
    if (status === 'playing') {
      openResumePrompt()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for win/loss → play sound + trigger high-score prompt on win
  useEffect(() => {
    if (status === 'won') {
      if (soundEnabled) {
        playSound('win', volume)
      }
      const boardKey = createBoardKey(config)
      if (isHighScore(boardKey, elapsedSeconds)) {
        showHighScorePrompt({ boardKey, timeSeconds: elapsedSeconds })
      }
    } else if (status === 'lost') {
      if (soundEnabled) {
        playSound('explode', volume)
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
      <ResumePrompt />
      <NewGameModal />
      <SettingsModal />
      <LeaderboardModal />
      <HighScorePrompt />
    </div>
  )
}
