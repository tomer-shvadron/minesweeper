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
  /** Non-null when the player just set a high score and needs to enter their name */
  highScoreEntry: HighScoreEntry | null
}

interface UIActions {
  openNewGameModal: () => void
  openSettingsModal: () => void
  openLeaderboardModal: () => void
  closeNewGameModal: () => void
  closeSettingsModal: () => void
  closeLeaderboardModal: () => void
  showHighScorePrompt: (entry: HighScoreEntry) => void
  dismissHighScorePrompt: () => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()((set) => ({
  newGameModalOpen: false,
  settingsModalOpen: false,
  leaderboardModalOpen: false,
  highScoreEntry: null,

  openNewGameModal: () =>
    set({ newGameModalOpen: true, settingsModalOpen: false, leaderboardModalOpen: false }),
  openSettingsModal: () =>
    set({ settingsModalOpen: true, newGameModalOpen: false, leaderboardModalOpen: false }),
  openLeaderboardModal: () =>
    set({ leaderboardModalOpen: true, newGameModalOpen: false, settingsModalOpen: false }),

  closeNewGameModal: () => set({ newGameModalOpen: false }),
  closeSettingsModal: () => set({ settingsModalOpen: false }),
  closeLeaderboardModal: () => set({ leaderboardModalOpen: false }),

  showHighScorePrompt: (entry) => set({ highScoreEntry: entry }),
  dismissHighScorePrompt: () => set({ highScoreEntry: null }),
}))
