import { useEffect, useRef } from 'react';

import { GameBoard } from '@/components/board/GameBoard';
import { GameOverBanner } from '@/components/game-over/GameOverBanner';
import { HighScorePrompt } from '@/components/modals/HighScorePrompt';
import { KeyboardModal } from '@/components/modals/KeyboardModal';
import { LeaderboardModal } from '@/components/modals/LeaderboardModal';
import { NewGameModal } from '@/components/modals/NewGameModal';
import { ResumePrompt } from '@/components/modals/ResumePrompt';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { StatisticsModal } from '@/components/modals/StatisticsModal';
import { NavBar } from '@/components/nav/NavBar';
import { TopBar } from '@/components/nav/TopBar';
import { Confetti } from '@/components/ui/Confetti';
import { useGameLayout } from '@/hooks/useGameLayout';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useHaptic } from '@/hooks/useHaptic';
import { useSound } from '@/hooks/useSound';
import { createBoardKey } from '@/services/board-core.service';
import { useGameStore } from '@/stores/game.store';
import { useLeaderboardStore } from '@/stores/leaderboard.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useStatsStore } from '@/stores/stats.store';
import { useUIStore } from '@/stores/ui.store';

export const App = () => {
  const theme = useSettingsStore((s) => s.theme);
  const backgroundStyle = useSettingsStore((s) => s.backgroundStyle);
  const status = useGameStore((s) => s.status);
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds);
  const config = useGameStore((s) => s.config);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const play = useSound();
  const vibrate = useHaptic();
  const { layoutMode, showTopBar, topBarHeight } = useGameLayout();

  // Ensure game timer ticks regardless of which layout components are mounted
  useGameTimer();
  const board = useGameStore((s) => s.board);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const firstClick = useGameStore((s) => s.firstClick);
  const isHighScore = useLeaderboardStore((s) => s.isHighScore);
  const incrementGamesPlayed = useLeaderboardStore((s) => s.incrementGamesPlayed);
  const recordGame = useStatsStore((s) => s.recordGame);
  const showHighScorePrompt = useUIStore((s) => s.showHighScorePrompt);
  const openResumePrompt = useUIStore((s) => s.openResumePrompt);

  // Apply selected theme as data attribute
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.setAttribute('data-animations', String(animationsEnabled));
  }, [animationsEnabled]);

  // Apply background style as data attribute
  useEffect(() => {
    document.body.setAttribute('data-bg-style', backgroundStyle);
  }, [backgroundStyle]);

  // Expose layout mode as data attribute for CSS selectors (game-over overlay, etc.)
  useEffect(() => {
    document.body.setAttribute('data-layout', layoutMode);
  }, [layoutMode]);

  // Expose game-over state so CSS can disable hover effects on cells
  const isGameOver = status === 'won' || status === 'lost';
  useEffect(() => {
    document.body.setAttribute('data-game-over', String(isGameOver));
  }, [isGameOver]);

  // Show resume prompt on mount if a game was in progress (uses refs to avoid deps)
  const mountStatusRef = useRef(status);
  const mountResumeRef = useRef(openResumePrompt);
  useEffect(() => {
    if (mountStatusRef.current === 'playing') {
      mountResumeRef.current();
    }
  }, []);

  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Skip if status hasn't actually changed (e.g. persisted 'won'/'lost' on page refresh)
    if (status === prevStatus) {
      return;
    }

    if (status === 'won' || status === 'lost') {
      const boardKey = createBoardKey(config);
      const cellsRevealed = board.flat().filter((c) => c.isRevealed && !c.hasMine).length;
      const minesFlagged = board.flat().filter((c) => c.isFlagged && c.hasMine).length;
      const safeFirstClick = firstClick ?? [0, 0];
      recordGame({
        id: crypto.randomUUID(),
        boardKey,
        result: status,
        timeSeconds: elapsedSeconds,
        date: new Date().toISOString(),
        firstClick: safeFirstClick,
        totalClicks,
        cellsRevealed,
        minesFlagged,
        efficiency: totalClicks > 0 ? cellsRevealed / totalClicks : 0,
      });
    }

    if (status === 'won') {
      play('win');
      vibrate('win');
      const boardKey = createBoardKey(config);
      incrementGamesPlayed(boardKey);
      if (isHighScore(boardKey, elapsedSeconds)) {
        showHighScorePrompt({ boardKey, timeSeconds: elapsedSeconds });
      }
    } else if (status === 'lost') {
      play('explode');
      vibrate('loss');
      const boardKey = createBoardKey(config);
      incrementGamesPlayed(boardKey);
    }
  }, [
    status,
    config,
    board,
    elapsedSeconds,
    firstClick,
    totalClicks,
    play,
    vibrate,
    isHighScore,
    incrementGamesPlayed,
    recordGame,
    showHighScorePrompt,
  ]);

  // Dynamic main padding based on layout mode
  const mainStyle = showTopBar ? { paddingTop: `${topBarHeight}px` } : { paddingBottom: '64px' }; // NAV_BAR_HEIGHT for mobile-portrait

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--color-bg)]">
      <a
        href="#game-board"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[var(--color-accent)] focus:px-3 focus:py-1 focus:text-white"
      >
        Skip to game board
      </a>

      {showTopBar && <TopBar compact={layoutMode === 'mobile-landscape'} />}

      {/* Board area: centered in remaining viewport space */}
      <main className="flex flex-1 items-center justify-center" style={mainStyle}>
        <GameBoard />
      </main>

      {!showTopBar && <NavBar />}

      <GameOverBanner />
      <Confetti />
      <ResumePrompt />
      <NewGameModal />
      <SettingsModal />
      <LeaderboardModal />
      <StatisticsModal />
      <KeyboardModal />
      <HighScorePrompt />
    </div>
  );
};
