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
    // Strip control characters and zero-width chars
    const sanitized = name
      .split('')
      .filter((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        // Reject C0 controls (0x00–0x1F), C1 controls (0x7F–0x9F), and zero-width chars
        if (code <= 0x1f) {
          return false;
        }
        if (code >= 0x7f && code <= 0x9f) {
          return false;
        }
        if (code === 0x200b || code === 0x200c || code === 0x200d || code === 0xfeff) {
          return false;
        }
        return true;
      })
      .join('')
      .trim()
      .slice(0, 20);
    const trimmed = sanitized || 'Anonymous';
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
