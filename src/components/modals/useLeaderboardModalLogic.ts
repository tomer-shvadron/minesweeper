import { useState } from 'react';

import { useGameLayout } from '@/hooks/useGameLayout';
import { createBoardKey } from '@/services/board.service';
import { useGameStore } from '@/stores/game.store';
import { useLeaderboardStore } from '@/stores/leaderboard.store';
import { useStatsStore } from '@/stores/stats.store';
import { useUIStore } from '@/stores/ui.store';
import type { BoardKey } from '@/types/game.types';

const PRESET_KEYS: BoardKey[] = ['beginner', 'intermediate', 'expert'];

export const RECENT_TAB = '__recent__' as BoardKey;

export const useLeaderboardModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeLeaderboardModal);
  const { layoutMode } = useGameLayout();
  const allEntries = useLeaderboardStore((s) => s.entries);
  const allGamesPlayed = useLeaderboardStore((s) => s.gamesPlayed);
  const config = useGameStore((s) => s.config);
  const recentRecords = useStatsStore((s) => s.records);

  const currentBoardKey = createBoardKey(config);

  const customKeysWithScores = Object.keys(allEntries).filter(
    (k): k is BoardKey =>
      !PRESET_KEYS.includes(k as BoardKey) && (allEntries[k as BoardKey]?.length ?? 0) > 0
  );

  const allTabs: BoardKey[] = [...PRESET_KEYS, ...customKeysWithScores, RECENT_TAB];

  const [selectedTab, setSelectedTab] = useState<BoardKey>(() =>
    allTabs.includes(currentBoardKey) ? currentBoardKey : 'beginner'
  );

  const entries = allEntries[selectedTab] ?? [];
  const gamesPlayedCount = allGamesPlayed[selectedTab] ?? 0;
  const recentGames = recentRecords.slice(0, 50);

  return {
    layoutMode,
    allTabs,
    selectedTab,
    setSelectedTab,
    entries,
    gamesPlayedCount,
    recentGames,
    closeModal,
  };
};
