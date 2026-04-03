import { useEffect } from 'react';

import { TIMER_INTERVAL_MS } from '@/constants/ui.constants';
import { useGameStore } from '@/stores/game.store';

/**
 * Drives the game timer. Must be mounted at all times (e.g. in App)
 * so the timer ticks regardless of which layout components are rendered.
 */
export const useGameTimer = () => {
  const status = useGameStore((s) => s.status);
  const tick = useGameStore((s) => s.tick);

  useEffect(() => {
    if (status !== 'playing') {
      return;
    }
    const interval = setInterval(tick, TIMER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, tick]);
};
