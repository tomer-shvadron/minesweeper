import { useState } from 'react';

import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import { createBoardKey } from '@/services/board.service';
import { useGameStore } from '@/stores/game.store';
import { useStatsStore } from '@/stores/stats.store';
import { useUIStore } from '@/stores/ui.store';
import type { BoardKey } from '@/types/game.types';

const PRESET_KEYS: BoardKey[] = ['beginner', 'intermediate', 'expert'];

const PRESET_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
};

export function tabLabel(key: BoardKey): string {
  return PRESET_LABELS[key] ?? `Custom (${key})`;
}

export const useStatisticsModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeStatisticsModal);
  const records = useStatsStore((s) => s.records);
  const getWinRate = useStatsStore((s) => s.getWinRate);
  const getAverageTime = useStatsStore((s) => s.getAverageTime);
  const getBestTime = useStatsStore((s) => s.getBestTime);
  const getCurrentStreak = useStatsStore((s) => s.getCurrentStreak);
  const getBestStreak = useStatsStore((s) => s.getBestStreak);
  const getTotalTimePlayed = useStatsStore((s) => s.getTotalTimePlayed);
  const getAverageEfficiency = useStatsStore((s) => s.getAverageEfficiency);
  const getFirstClickHeatmap = useStatsStore((s) => s.getFirstClickHeatmap);
  const config = useGameStore((s) => s.config);

  const currentBoardKey = createBoardKey(config);

  // Custom keys that have recorded games
  const customKeysWithGames = [
    ...new Set(
      records
        .map((r) => r.boardKey)
        .filter((k) => !PRESET_KEYS.includes(k as (typeof PRESET_KEYS)[number]))
    ),
  ];

  const allTabs: BoardKey[] = [
    ...PRESET_KEYS,
    ...customKeysWithGames.filter(
      (k): k is BoardKey => !PRESET_KEYS.includes(k as (typeof PRESET_KEYS)[number])
    ),
  ];

  const defaultTab = allTabs.includes(currentBoardKey) ? currentBoardKey : 'beginner';
  const [selectedTab, setSelectedTab] = useState<BoardKey>(defaultTab);

  const tabRecords = records.filter((r) => r.boardKey === selectedTab);
  const totalGames = tabRecords.length;
  const wins = tabRecords.filter((r) => r.result === 'won').length;

  const winRate = getWinRate(selectedTab);
  const bestTime = getBestTime(selectedTab);
  const averageTime = getAverageTime(selectedTab);
  const currentStreak = getCurrentStreak(selectedTab);
  const bestStreak = getBestStreak(selectedTab);
  const totalTimePlayed = getTotalTimePlayed(selectedTab);
  const averageEfficiency = getAverageEfficiency(selectedTab);
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
    allTabs,
    selectedTab,
    setSelectedTab,
    closeModal,
    totalGames,
    wins,
    winRate,
    bestTime,
    averageTime,
    currentStreak,
    bestStreak,
    totalTimePlayed,
    averageEfficiency,
    heatmap,
    heatmapDims,
    showHeatmap: totalGames >= 10 && heatmap !== null && heatmapDims !== null,
  };
};
