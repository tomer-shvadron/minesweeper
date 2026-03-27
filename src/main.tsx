import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { useGameStore } from './stores/game.store';
import { useLeaderboardStore } from './stores/leaderboard.store';
import { useUIStore } from './stores/ui.store';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.MODE !== 'production' || import.meta.env.VITE_E2E === 'true') {
  // @ts-expect-error — e2e test bridge
  window.__MINESWEEPER_TEST__ = {
    getGameState: () => useGameStore.getState(),
    setGameState: (partial: Partial<ReturnType<typeof useGameStore.getState>>) =>
      useGameStore.setState(partial),
    getLeaderboardState: () => useLeaderboardStore.getState(),
    setLeaderboardState: (partial: Partial<ReturnType<typeof useLeaderboardStore.getState>>) =>
      useLeaderboardStore.setState(partial),
    getUIState: () => useUIStore.getState(),
    setUIState: (partial: Partial<ReturnType<typeof useUIStore.getState>>) =>
      useUIStore.setState(partial),
    revealCell: (row: number, col: number) => useGameStore.getState().revealCell(row, col),
    startNewGame: (config?: { rows: number; cols: number; mines: number }) =>
      useGameStore.getState().startNewGame(config),
    openNewGameModal: () => useUIStore.getState().openNewGameModal(),
  };
}
