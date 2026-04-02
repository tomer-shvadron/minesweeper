import { create } from 'zustand';

import type { BoardKey } from '@/types/game.types';

export interface HighScoreEntry {
  timeSeconds: number;
  boardKey: BoardKey;
}

export type ModalName = 'newGame' | 'settings' | 'leaderboard' | 'statistics' | null;

interface UIState {
  /** Currently active exclusive modal. Only one can be open at a time. */
  activeModal: ModalName;
  /** Keyboard modal is a sub-modal of settings, not mutually exclusive. */
  keyboardModalOpen: boolean;
  resumePromptOpen: boolean;
  /** Non-null when the player just set a high score and needs to enter their name */
  highScoreEntry: HighScoreEntry | null;
  /** Currently keyboard-focused cell [row, col], null when keyboard nav not active */
  focusedCell: [number, number] | null;
}

interface UIActions {
  openModal: (name: ModalName) => void;
  closeModal: () => void;
  openNewGameModal: () => void;
  openSettingsModal: () => void;
  openLeaderboardModal: () => void;
  openStatisticsModal: () => void;
  openKeyboardModal: () => void;
  closeNewGameModal: () => void;
  closeSettingsModal: () => void;
  closeLeaderboardModal: () => void;
  closeStatisticsModal: () => void;
  closeKeyboardModal: () => void;
  openResumePrompt: () => void;
  closeResumePrompt: () => void;
  showHighScorePrompt: (entry: HighScoreEntry) => void;
  dismissHighScorePrompt: () => void;
  setFocusedCell: (cell: [number, number] | null) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()((set) => ({
  activeModal: null,
  keyboardModalOpen: false,
  resumePromptOpen: false,
  highScoreEntry: null,
  focusedCell: null,

  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),

  // Convenience aliases that preserve the existing API surface
  openNewGameModal: () => set({ activeModal: 'newGame' }),
  openSettingsModal: () => set({ activeModal: 'settings' }),
  openLeaderboardModal: () => set({ activeModal: 'leaderboard' }),
  openStatisticsModal: () => set({ activeModal: 'statistics' }),
  openKeyboardModal: () => set({ keyboardModalOpen: true }),
  closeNewGameModal: () => set({ activeModal: null }),
  closeSettingsModal: () => set({ activeModal: null }),
  closeLeaderboardModal: () => set({ activeModal: null }),
  closeStatisticsModal: () => set({ activeModal: null }),
  closeKeyboardModal: () => set({ keyboardModalOpen: false }),

  openResumePrompt: () => set({ resumePromptOpen: true }),
  closeResumePrompt: () => set({ resumePromptOpen: false }),

  showHighScorePrompt: (entry) => set({ highScoreEntry: entry }),
  dismissHighScorePrompt: () => set({ highScoreEntry: null }),

  setFocusedCell: (cell) => set({ focusedCell: cell }),
}));
