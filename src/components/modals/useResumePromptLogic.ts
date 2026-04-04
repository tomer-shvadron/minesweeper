import { useShallow } from 'zustand/react/shallow';

import { useGameLayout } from '@/hooks/useGameLayout';
import { createBoardKey } from '@/services/board-core.service';
import { useGameStore } from '@/stores/game.store';
import { useUIStore } from '@/stores/ui.store';
import { formatTime } from '@/utils/time.utils';

export const useResumePromptLogic = () => {
  const { layoutMode } = useGameLayout();
  const { isOpen, closeResumePrompt, openNewGameModal } = useUIStore(
    useShallow((s) => ({
      isOpen: s.resumePromptOpen,
      closeResumePrompt: s.closeResumePrompt,
      openNewGameModal: s.openNewGameModal,
    }))
  );
  const { config, elapsedSeconds, startNewGame } = useGameStore(
    useShallow((s) => ({
      config: s.config,
      elapsedSeconds: s.elapsedSeconds,
      startNewGame: s.startNewGame,
    }))
  );

  const boardKey = createBoardKey(config);
  const timeStr = formatTime(elapsedSeconds);

  const handleResume = () => {
    closeResumePrompt();
  };

  const handleNewGame = () => {
    closeResumePrompt();
    startNewGame();
    openNewGameModal();
  };

  return { layoutMode, isOpen, boardKey, timeStr, config, handleResume, handleNewGame };
};
