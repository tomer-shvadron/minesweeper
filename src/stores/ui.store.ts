import { create } from 'zustand'

import type { BoardKey } from '@/types/game.types'

export interface HighScoreEntry {
  timeSeconds: number
  boardKey: BoardKey
}

interface UIState {
  newGameModalOpen: boolean
  settingsModalOpen: boolean
  leaderboardModalOpen: boolean
  statisticsModalOpen: boolean
  resumePromptOpen: boolean
  /** Non-null when the player just set a high score and needs to enter their name */
  highScoreEntry: HighScoreEntry | null
}

interface UIActions {
  openNewGameModal: () => void
  openSettingsModal: () => void
  openLeaderboardModal: () => void
  openStatisticsModal: () => void
  closeNewGameModal: () => void
  closeSettingsModal: () => void
  closeLeaderboardModal: () => void
  closeStatisticsModal: () => void
  openResumePrompt: () => void
  closeResumePrompt: () => void
  showHighScorePrompt: (entry: HighScoreEntry) => void
  dismissHighScorePrompt: () => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()((set) => ({
  newGameModalOpen: false,
  settingsModalOpen: false,
  leaderboardModalOpen: false,
  statisticsModalOpen: false,
  resumePromptOpen: false,
  highScoreEntry: null,

  openNewGameModal: () =>
    set({
      newGameModalOpen: true,
      settingsModalOpen: false,
      leaderboardModalOpen: false,
      statisticsModalOpen: false,
    }),
  openSettingsModal: () =>
    set({
      settingsModalOpen: true,
      newGameModalOpen: false,
      leaderboardModalOpen: false,
      statisticsModalOpen: false,
    }),
  openLeaderboardModal: () =>
    set({
      leaderboardModalOpen: true,
      newGameModalOpen: false,
      settingsModalOpen: false,
      statisticsModalOpen: false,
    }),
  openStatisticsModal: () =>
    set({
      statisticsModalOpen: true,
      newGameModalOpen: false,
      settingsModalOpen: false,
      leaderboardModalOpen: false,
    }),

  closeNewGameModal: () => set({ newGameModalOpen: false }),
  closeSettingsModal: () => set({ settingsModalOpen: false }),
  closeLeaderboardModal: () => set({ leaderboardModalOpen: false }),
  closeStatisticsModal: () => set({ statisticsModalOpen: false }),

  openResumePrompt: () => set({ resumePromptOpen: true }),
  closeResumePrompt: () => set({ resumePromptOpen: false }),

  showHighScorePrompt: (entry) => set({ highScoreEntry: entry }),
  dismissHighScorePrompt: () => set({ highScoreEntry: null }),
}))
