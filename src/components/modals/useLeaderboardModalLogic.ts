import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useGameLayout } from '@/hooks/useGameLayout';
import { createBoardKey } from '@/services/board-core.service';
import { useGameStore } from '@/stores/game.store';
import { useLeaderboardStore } from '@/stores/leaderboard.store';
import { useStatsStore } from '@/stores/stats.store';
import { useUIStore } from '@/stores/ui.store';
import type { BoardKey } from '@/types/game.types';
import { PRESET_BOARD_KEYS } from '@/utils/board.utils';

export const RECENT_TAB = '__recent__' as BoardKey;

export const useLeaderboardModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeLeaderboardModal);
  const { layoutMode } = useGameLayout();
  const { entries: allEntries, gamesPlayed: allGamesPlayed } = useLeaderboardStore(
    useShallow((s) => ({
      entries: s.entries,
      gamesPlayed: s.gamesPlayed,
    }))
  );
  const config = useGameStore((s) => s.config);
  const recentRecords = useStatsStore((s) => s.records);

  const currentBoardKey = createBoardKey(config);

  const customKeysWithScores = Object.keys(allEntries).filter(
    (k): k is BoardKey =>
      !PRESET_BOARD_KEYS.includes(k as BoardKey) && (allEntries[k as BoardKey]?.length ?? 0) > 0
  );

  const allTabs: BoardKey[] = [...PRESET_BOARD_KEYS, ...customKeysWithScores, RECENT_TAB];

  const [selectedTab, setSelectedTab] = useState<BoardKey>(() =>
    allTabs.includes(currentBoardKey) ? currentBoardKey : 'beginner'
  );

  const entries = (allEntries[selectedTab] ?? []).slice(0, 10);
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
