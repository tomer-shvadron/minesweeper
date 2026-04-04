import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useGameStore } from '@/stores/game.store';
import { useUIStore } from '@/stores/ui.store';

export const useGameOverBannerLogic = () => {
  const { status, elapsedSeconds, board, startNewGame } = useGameStore(
    useShallow((s) => ({
      status: s.status,
      elapsedSeconds: s.elapsedSeconds,
      board: s.board,
      startNewGame: s.startNewGame,
    }))
  );
  const { highScoreEntry, openNewGameModal } = useUIStore(
    useShallow((s) => ({
      highScoreEntry: s.highScoreEntry,
      openNewGameModal: s.openNewGameModal,
    }))
  );

  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed flag whenever game status changes (new game started, etc.)
  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    setDismissed(false);
  }

  const isVisible =
    !dismissed && (status === 'won' || status === 'lost') && highScoreEntry === null;

  const cellsRevealed = board.flat().filter((c) => c.isRevealed && !c.hasMine).length;
  const minesFlagged = board.flat().filter((c) => c.isFlagged && c.hasMine).length;

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Escape key to dismiss
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDismissed(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  return {
    isVisible,
    isWon: status === 'won',
    elapsedSeconds,
    cellsRevealed,
    minesFlagged,
    handlePlayAgain: () => startNewGame(),
    handleChangeLevel: openNewGameModal,
    handleDismiss,
  };
};
