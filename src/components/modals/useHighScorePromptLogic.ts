import { useState } from 'react';

import { useLeaderboardStore } from '@/stores/leaderboard.store';
import { useUIStore } from '@/stores/ui.store';

export const useHighScorePromptLogic = () => {
  const highScoreEntry = useUIStore((s) => s.highScoreEntry);
  const dismissHighScorePrompt = useUIStore((s) => s.dismissHighScorePrompt);
  const openLeaderboardModal = useUIStore((s) => s.openLeaderboardModal);
  const addEntry = useLeaderboardStore((s) => s.addEntry);

  // Lazy initialiser reads directly from the already-hydrated store instance so the
  // persisted localStorage value is captured even before any React re-render cycle.
  // We then preserve the value in local state across opens so subsequent prompts are
  // also pre-filled without touching the store on every keystroke.
  const [name, setName] = useState(() => useLeaderboardStore.getState().lastPlayerName);

  const handleSubmit = () => {
    if (!highScoreEntry) {
      return;
    }
    const trimmed = name.trim() || 'Anonymous';
    addEntry(highScoreEntry.boardKey, {
      name: trimmed,
      timeSeconds: highScoreEntry.timeSeconds,
      date: new Date().toISOString(),
    });
    setName(trimmed);
    dismissHighScorePrompt();
    openLeaderboardModal();
  };

  const handleDismiss = () => {
    dismissHighScorePrompt();
  };

  return {
    isOpen: highScoreEntry !== null,
    timeSeconds: highScoreEntry?.timeSeconds ?? 0,
    name,
    setName,
    handleSubmit,
    handleDismiss,
  };
};
