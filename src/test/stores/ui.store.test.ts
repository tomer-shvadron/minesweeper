import { beforeEach, describe, expect, it } from 'vitest';

import { useUIStore } from '@/stores/ui.store';

const resetStore = () =>
  useUIStore.setState({
    activeModal: null,
    keyboardModalOpen: false,
    resumePromptOpen: false,
    highScoreEntry: null,
    focusedCell: null,
  });

beforeEach(resetStore);

describe('ui.store', () => {
  // ----------------------------------------------------------------
  describe('openNewGameModal', () => {
    it('opens the new game modal', () => {
      useUIStore.getState().openNewGameModal();
      expect(useUIStore.getState().activeModal).toBe('newGame');
    });

    it('closes other modals when opened', () => {
      useUIStore.getState().openSettingsModal();
      useUIStore.getState().openNewGameModal();
      expect(useUIStore.getState().activeModal).toBe('newGame');
    });
  });

  describe('openSettingsModal', () => {
    it('opens the settings modal', () => {
      useUIStore.getState().openSettingsModal();
      expect(useUIStore.getState().activeModal).toBe('settings');
    });

    it('closes other modals when opened', () => {
      useUIStore.getState().openNewGameModal();
      useUIStore.getState().openSettingsModal();
      expect(useUIStore.getState().activeModal).toBe('settings');
    });
  });

  describe('openLeaderboardModal', () => {
    it('opens the leaderboard modal', () => {
      useUIStore.getState().openLeaderboardModal();
      expect(useUIStore.getState().activeModal).toBe('leaderboard');
    });

    it('closes other modals when opened', () => {
      useUIStore.getState().openNewGameModal();
      useUIStore.getState().openLeaderboardModal();
      expect(useUIStore.getState().activeModal).toBe('leaderboard');
    });
  });

  describe('openStatisticsModal', () => {
    it('opens the statistics modal', () => {
      useUIStore.getState().openStatisticsModal();
      expect(useUIStore.getState().activeModal).toBe('statistics');
    });
  });

  describe('modal exclusivity — only one modal open at a time', () => {
    it('opening a second modal closes the first', () => {
      useUIStore.getState().openNewGameModal();
      expect(useUIStore.getState().activeModal).toBe('newGame');

      useUIStore.getState().openSettingsModal();
      expect(useUIStore.getState().activeModal).toBe('settings');
    });

    it('cycling through all modals always leaves only the last one open', () => {
      useUIStore.getState().openNewGameModal();
      useUIStore.getState().openLeaderboardModal();
      useUIStore.getState().openSettingsModal();

      expect(useUIStore.getState().activeModal).toBe('settings');
    });
  });

  describe('close actions', () => {
    it('closeNewGameModal sets activeModal to null', () => {
      useUIStore.getState().openNewGameModal();
      useUIStore.getState().closeNewGameModal();
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it('closeSettingsModal sets activeModal to null', () => {
      useUIStore.getState().openSettingsModal();
      useUIStore.getState().closeSettingsModal();
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it('closeLeaderboardModal sets activeModal to null', () => {
      useUIStore.getState().openLeaderboardModal();
      useUIStore.getState().closeLeaderboardModal();
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it('closeModal sets activeModal to null', () => {
      useUIStore.getState().openStatisticsModal();
      useUIStore.getState().closeModal();
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it('closing when no modal is open is a no-op', () => {
      useUIStore.getState().closeNewGameModal();
      expect(useUIStore.getState().activeModal).toBeNull();
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
      expect(useUIStore.getState().activeModal).toBe('newGame');
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

  describe('keyboardModal', () => {
    it('openKeyboardModal sets keyboardModalOpen to true', () => {
      useUIStore.getState().openKeyboardModal();
      expect(useUIStore.getState().keyboardModalOpen).toBe(true);
    });

    it('closeKeyboardModal sets keyboardModalOpen to false', () => {
      useUIStore.getState().openKeyboardModal();
      useUIStore.getState().closeKeyboardModal();
      expect(useUIStore.getState().keyboardModalOpen).toBe(false);
    });

    it('keyboardModal is independent from activeModal', () => {
      useUIStore.getState().openSettingsModal();
      useUIStore.getState().openKeyboardModal();
      expect(useUIStore.getState().activeModal).toBe('settings');
      expect(useUIStore.getState().keyboardModalOpen).toBe(true);
    });
  });
});
