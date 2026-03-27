import { beforeEach, describe, expect, it } from 'vitest';

import { useUIStore } from '@/stores/ui.store';

const resetStore = () =>
  useUIStore.setState({
    newGameModalOpen: false,
    settingsModalOpen: false,
    leaderboardModalOpen: false,
    resumePromptOpen: false,
    highScoreEntry: null,
  });

beforeEach(resetStore);

describe('ui.store', () => {
  // ----------------------------------------------------------------
  describe('openNewGameModal', () => {
    it('opens the new game modal', () => {
      useUIStore.getState().openNewGameModal();
      expect(useUIStore.getState().newGameModalOpen).toBe(true);
    });

    it('closes settings and leaderboard modals when opened', () => {
      useUIStore.setState({ settingsModalOpen: true, leaderboardModalOpen: true });
      useUIStore.getState().openNewGameModal();
      expect(useUIStore.getState().settingsModalOpen).toBe(false);
      expect(useUIStore.getState().leaderboardModalOpen).toBe(false);
    });
  });

  describe('openSettingsModal', () => {
    it('opens the settings modal', () => {
      useUIStore.getState().openSettingsModal();
      expect(useUIStore.getState().settingsModalOpen).toBe(true);
    });

    it('closes new game and leaderboard modals when opened', () => {
      useUIStore.setState({ newGameModalOpen: true, leaderboardModalOpen: true });
      useUIStore.getState().openSettingsModal();
      expect(useUIStore.getState().newGameModalOpen).toBe(false);
      expect(useUIStore.getState().leaderboardModalOpen).toBe(false);
    });
  });

  describe('openLeaderboardModal', () => {
    it('opens the leaderboard modal', () => {
      useUIStore.getState().openLeaderboardModal();
      expect(useUIStore.getState().leaderboardModalOpen).toBe(true);
    });

    it('closes new game and settings modals when opened', () => {
      useUIStore.setState({ newGameModalOpen: true, settingsModalOpen: true });
      useUIStore.getState().openLeaderboardModal();
      expect(useUIStore.getState().newGameModalOpen).toBe(false);
      expect(useUIStore.getState().settingsModalOpen).toBe(false);
    });
  });

  describe('modal exclusivity — only one modal open at a time', () => {
    it('opening a second modal closes the first', () => {
      useUIStore.getState().openNewGameModal();
      expect(useUIStore.getState().newGameModalOpen).toBe(true);

      useUIStore.getState().openSettingsModal();
      expect(useUIStore.getState().newGameModalOpen).toBe(false);
      expect(useUIStore.getState().settingsModalOpen).toBe(true);
    });

    it('cycling through all three modals always leaves only one open', () => {
      useUIStore.getState().openNewGameModal();
      useUIStore.getState().openLeaderboardModal();
      useUIStore.getState().openSettingsModal();

      const state = useUIStore.getState();
      const openCount = [
        state.newGameModalOpen,
        state.leaderboardModalOpen,
        state.settingsModalOpen,
      ].filter(Boolean).length;
      expect(openCount).toBe(1);
      expect(state.settingsModalOpen).toBe(true);
    });
  });

  describe('close actions', () => {
    it('closeNewGameModal sets newGameModalOpen to false', () => {
      useUIStore.setState({ newGameModalOpen: true });
      useUIStore.getState().closeNewGameModal();
      expect(useUIStore.getState().newGameModalOpen).toBe(false);
    });

    it('closeSettingsModal sets settingsModalOpen to false', () => {
      useUIStore.setState({ settingsModalOpen: true });
      useUIStore.getState().closeSettingsModal();
      expect(useUIStore.getState().settingsModalOpen).toBe(false);
    });

    it('closeLeaderboardModal sets leaderboardModalOpen to false', () => {
      useUIStore.setState({ leaderboardModalOpen: true });
      useUIStore.getState().closeLeaderboardModal();
      expect(useUIStore.getState().leaderboardModalOpen).toBe(false);
    });

    it('closing an already-closed modal is a no-op', () => {
      useUIStore.getState().closeNewGameModal();
      expect(useUIStore.getState().newGameModalOpen).toBe(false);
    });
  });

  describe('resumePrompt', () => {
    it('openResumePrompt sets resumePromptOpen to true', () => {
      useUIStore.getState().openResumePrompt();
      expect(useUIStore.getState().resumePromptOpen).toBe(true);
    });

    it('closeResumePrompt sets resumePromptOpen to false', () => {
      useUIStore.setState({ resumePromptOpen: true });
      useUIStore.getState().closeResumePrompt();
      expect(useUIStore.getState().resumePromptOpen).toBe(false);
    });

    it('resumePrompt is independent from the other modals', () => {
      useUIStore.getState().openResumePrompt();
      useUIStore.getState().openNewGameModal();
      // Opening new game modal should NOT close the resume prompt
      expect(useUIStore.getState().resumePromptOpen).toBe(true);
      expect(useUIStore.getState().newGameModalOpen).toBe(true);
    });
  });

  describe('highScoreEntry', () => {
    it('showHighScorePrompt sets the entry', () => {
      const entry = { timeSeconds: 42, boardKey: 'beginner' as const };
      useUIStore.getState().showHighScorePrompt(entry);
      expect(useUIStore.getState().highScoreEntry).toEqual(entry);
    });

    it('dismissHighScorePrompt clears the entry', () => {
      useUIStore.setState({ highScoreEntry: { timeSeconds: 42, boardKey: 'beginner' } });
      useUIStore.getState().dismissHighScorePrompt();
      expect(useUIStore.getState().highScoreEntry).toBeNull();
    });

    it('highScoreEntry is null by default', () => {
      expect(useUIStore.getState().highScoreEntry).toBeNull();
    });
  });
});
