import { useEffect, useState } from 'react';

import { useGameStore } from '@/stores/game.store';
import { useSettingsStore } from '@/stores/settings.store';
import type { LayoutMode } from '@/types/settings.types';
import {
  calcCellSize,
  DESKTOP_TOP_BAR_HEIGHT,
  getLayoutMode,
  MOBILE_LANDSCAPE_TOP_BAR_HEIGHT,
  NAV_BAR_HEIGHT,
} from '@/utils/layout.utils';

export const useGameLayout = () => {
  const config = useGameStore((s) => s.config);
  const boardSize = useSettingsStore((s) => s.boardSize);
  const cellStyle = useSettingsStore((s) => s.cellStyle);

  const [cellSize, setCellSize] = useState(() =>
    calcCellSize(config.rows, config.cols, boardSize, cellStyle)
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getLayoutMode);

  useEffect(() => {
    const recalc = () => {
      setLayoutMode(getLayoutMode());
      setCellSize(calcCellSize(config.rows, config.cols, boardSize, cellStyle));
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

    // Also listen for pointer capability changes (e.g. docking a tablet)
    const pointerMql = window.matchMedia('(pointer: fine)');
    pointerMql.addEventListener('change', recalc);

    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('orientationchange', handleOrientationChange);
      pointerMql.removeEventListener('change', recalc);
      clearTimeout(orientationTimer);
    };
  }, [config.rows, config.cols, boardSize, cellStyle]);

  // Convenience booleans derived from layoutMode
  const showTopBar = layoutMode === 'desktop' || layoutMode === 'mobile-landscape';
  const showBottomNav = layoutMode === 'mobile-portrait';
  const showFloatingPills = layoutMode === 'mobile-portrait';
  const topBarHeight =
    layoutMode === 'desktop'
      ? DESKTOP_TOP_BAR_HEIGHT
      : layoutMode === 'mobile-landscape'
        ? MOBILE_LANDSCAPE_TOP_BAR_HEIGHT
        : 0;

  return {
    cellSize,
    boardWidth: cellSize * config.cols,
    boardHeight: cellSize * config.rows,
    layoutMode,
    showTopBar,
    showBottomNav,
    showFloatingPills,
    topBarHeight,
    navBarHeight: NAV_BAR_HEIGHT,
    config,
  };
};
