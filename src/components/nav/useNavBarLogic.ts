import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useGameStore } from '@/stores/game.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';
import type { GameStatus } from '@/types/game.types';

const EMOJI: Record<GameStatus | 'nervous', string> = {
  idle: '\u{1F642}',
  playing: '\u{1F642}',
  generating: '\u{1F642}',
  won: '\u{1F60E}',
  lost: '\u{1F635}',
  nervous: '\u{1F62E}',
};

export const useNavBarLogic = () => {
  const { openSettingsModal, openLeaderboardModal, openStatisticsModal, openNewGameModal } =
    useUIStore(
      useShallow((s) => ({
        openSettingsModal: s.openSettingsModal,
        openLeaderboardModal: s.openLeaderboardModal,
        openStatisticsModal: s.openStatisticsModal,
        openNewGameModal: s.openNewGameModal,
      }))
    );

  const status = useGameStore((s) => s.status);
  const isPressingCell = useGameStore((s) => s.isPressingCell);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);

  const emoji = isPressingCell && status === 'playing' ? EMOJI.nervous : EMOJI[status];

  // Smiley animation — adjust state during render when status changes
  // (React-recommended pattern for deriving state from props/external stores)
  const [smileyAnimClass, setSmileyAnimClass] = useState<string>('');
  const [prevStatus, setPrevStatus] = useState<GameStatus>(status);

  if (prevStatus !== status) {
    setPrevStatus(status);
    if (animationsEnabled && (status === 'won' || status === 'lost')) {
      setSmileyAnimClass(status === 'won' ? 'smiley--win' : 'smiley--loss');
    }
  }

  // Tint class for the smiley container
  const smileyTint =
    status === 'won'
      ? 'ring-2 ring-green-400/40'
      : status === 'lost'
        ? 'ring-2 ring-red-400/40'
        : '';

  return {
    emoji,
    smileyAnimClass,
    smileyTint,
    clearSmileyAnimClass: () => setSmileyAnimClass(''),
    openSettingsModal,
    openLeaderboardModal,
    openStatisticsModal,
    openNewGameModal,
  };
};
