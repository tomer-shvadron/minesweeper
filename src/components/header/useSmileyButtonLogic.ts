import { useEffect, useRef, useState } from 'react';

import { useGameStore } from '@/stores/game.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';
import type { GameStatus } from '@/types/game.types';

const EMOJI: Record<GameStatus | 'nervous', string> = {
  idle: '🙂',
  playing: '🙂',
  won: '😎',
  lost: '😵',
  nervous: '😮',
};

export const useSmileyButtonLogic = () => {
  const status = useGameStore((s) => s.status);
  const isPressingCell = useGameStore((s) => s.isPressingCell);
  const openNewGameModal = useUIStore((s) => s.openNewGameModal);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);

  const emoji = isPressingCell && status === 'playing' ? EMOJI.nervous : EMOJI[status];

  const prevStatusRef = useRef<GameStatus>(status);
  const [animClass, setAnimClass] = useState<string>('');

  useEffect(() => {
    if (!animationsEnabled) {
      return;
    }
    if (prevStatusRef.current === status) {
      return;
    }
    prevStatusRef.current = status;
    if (status === 'won') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimClass('smiley--win');
    } else if (status === 'lost') {
      setAnimClass('smiley--loss');
    }
  }, [status, animationsEnabled]);

  return {
    emoji,
    label: 'New game',
    onPress: openNewGameModal,
    animClass,
    clearAnimClass: () => setAnimClass(''),
  };
};
