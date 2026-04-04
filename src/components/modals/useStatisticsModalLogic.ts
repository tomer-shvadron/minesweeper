import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import { useGameLayout } from '@/hooks/useGameLayout';
import { createBoardKey } from '@/services/board-core.service';
import { useGameStore } from '@/stores/game.store';
import { useStatsStore } from '@/stores/stats.store';
import { useUIStore } from '@/stores/ui.store';
import type { BoardKey } from '@/types/game.types';
import { PRESET_BOARD_KEYS } from '@/utils/board.utils';

export const useStatisticsModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeStatisticsModal);
  const { layoutMode } = useGameLayout();
  const { records, getStatsForBoard, getFirstClickHeatmap } = useStatsStore(
    useShallow((s) => ({
      records: s.records,
      getStatsForBoard: s.getStatsForBoard,
      getFirstClickHeatmap: s.getFirstClickHeatmap,
    }))
  );
  const config = useGameStore((s) => s.config);

  const currentBoardKey = createBoardKey(config);

  // Custom keys that have recorded games
  const customKeysWithGames = [
    ...new Set(
      records
        .map((r) => r.boardKey)
        .filter((k) => !PRESET_BOARD_KEYS.includes(k as (typeof PRESET_BOARD_KEYS)[number]))
    ),
  ];

  const allTabs: BoardKey[] = [
    ...PRESET_BOARD_KEYS,
    ...customKeysWithGames.filter(
      (k): k is BoardKey => !PRESET_BOARD_KEYS.includes(k as (typeof PRESET_BOARD_KEYS)[number])
    ),
  ];

  const defaultTab = allTabs.includes(currentBoardKey) ? currentBoardKey : 'beginner';
  const [selectedTab, setSelectedTab] = useState<BoardKey>(defaultTab);

  // Single-pass stats computation for the selected board
  const stats = getStatsForBoard(selectedTab);
  const heatmap = getFirstClickHeatmap(selectedTab);

  const heatmapDims = (() => {
    const preset = DIFFICULTY_PRESETS[selectedTab as keyof typeof DIFFICULTY_PRESETS];
    if (preset) {
      return { rows: preset.rows, cols: preset.cols };
    }
    const parts = selectedTab.split('x');
    if (parts.length === 3) {
      const cols = parseInt(parts[0] ?? '0', 10);
      const rows = parseInt(parts[1] ?? '0', 10);
      if (cols > 0 && rows > 0) {
        return { rows, cols };
      }
    }
    return null;
  })();

  return {
    layoutMode,
    allTabs,
    selectedTab,
    setSelectedTab,
    closeModal,
    totalGames: stats.totalGames,
    wins: stats.wins,
    winRate: stats.winRate,
    bestTime: stats.bestTime,
    averageTime: stats.averageTime,
    currentStreak: stats.currentStreak,
    bestStreak: stats.bestStreak,
    totalTimePlayed: stats.totalTimePlayed,
    heatmap,
    heatmapDims,
    showHeatmap: stats.totalGames >= 10 && heatmap !== null && heatmapDims !== null,
  };
};
