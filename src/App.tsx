import { useEffect, useRef } from 'react'

import { GameBoard } from '@/components/board/GameBoard'
import { GameOverBanner } from '@/components/game-over/GameOverBanner'
import { Header } from '@/components/header/Header'
import { HighScorePrompt } from '@/components/modals/HighScorePrompt'
import { LeaderboardModal } from '@/components/modals/LeaderboardModal'
import { NewGameModal } from '@/components/modals/NewGameModal'
import { ResumePrompt } from '@/components/modals/ResumePrompt'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { Confetti } from '@/components/ui/Confetti'
import { createBoardKey } from '@/services/board.service'
import { haptic } from '@/services/haptic.service'
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
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled)
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled)
  const isHighScore = useLeaderboardStore((s) => s.isHighScore)
  const incrementGamesPlayed = useLeaderboardStore((s) => s.incrementGamesPlayed)
  const showHighScorePrompt = useUIStore((s) => s.showHighScorePrompt)
  const openResumePrompt = useUIStore((s) => s.openResumePrompt)

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.body.setAttribute('data-animations', String(animationsEnabled))
  }, [animationsEnabled])

  useEffect(() => {
    if (status === 'playing') {
      openResumePrompt()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const prevStatusRef = useRef(status)
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status

    // Skip if status hasn't actually changed (e.g. persisted 'won'/'lost' on page refresh)
    if (status === prevStatus) {
      return
    }

    if (status === 'won') {
      if (soundEnabled) {
        playSound('win', volume)
      }
      haptic('win', hapticEnabled)
      const boardKey = createBoardKey(config)
      incrementGamesPlayed(boardKey)
      if (isHighScore(boardKey, elapsedSeconds)) {
        showHighScorePrompt({ boardKey, timeSeconds: elapsedSeconds })
      }
    } else if (status === 'lost') {
      if (soundEnabled) {
        playSound('explode', volume)
      }
      haptic('loss', hapticEnabled)
      const boardKey = createBoardKey(config)
      incrementGamesPlayed(boardKey)
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="game-window">
        <Header />
        <GameBoard />
      </div>

      <GameOverBanner />
      <Confetti />
      <ResumePrompt />
      <NewGameModal />
      <SettingsModal />
      <LeaderboardModal />
      <HighScorePrompt />
    </div>
  )
}
