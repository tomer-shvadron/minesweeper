import { useEffect, useState } from 'react';

import { useGameStore } from '@/stores/game.store';
import { calcCellSize, HEADER_SIDEBAR_WIDTH } from '@/utils/layout.utils';

export const useGameLayout = () => {
  const config = useGameStore((s) => s.config);

  const [cellSize, setCellSize] = useState(() => calcCellSize(config.rows, config.cols));
  const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight);

  useEffect(() => {
    const recalc = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      setCellSize(calcCellSize(config.rows, config.cols));
    };
    recalc();

    // On iOS Safari the viewport dimensions haven't updated yet when the `resize`
    // event fires during an orientation change, so we delay the recalculation.
    let orientationTimer: ReturnType<typeof setTimeout>;
    const handleOrientationChange = () => {
      orientationTimer = setTimeout(recalc, 100);
    };

    window.addEventListener('resize', recalc);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(orientationTimer);
    };
  }, [config.rows, config.cols]);

  return {
    cellSize,
    boardWidth: cellSize * config.cols,
    boardHeight: cellSize * config.rows,
    isLandscape,
    headerSidebarWidth: HEADER_SIDEBAR_WIDTH,
    config,
  };
};
