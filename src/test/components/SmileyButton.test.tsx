import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NavBar } from '@/components/nav/NavBar';
import type { GameStatus } from '@/types/game.types';

const mockOpenNewGameModal = vi.fn();
const mockOpenSettingsModal = vi.fn();
const mockOpenLeaderboardModal = vi.fn();
const mockOpenStatisticsModal = vi.fn();

// Mutable state shared across all store calls in this file
let mockStatus: GameStatus = 'idle';
let mockIsPressingCell = false;

vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({
      status: mockStatus,
      isPressingCell: mockIsPressingCell,
      config: { rows: 9, cols: 9, mines: 10 },
    }),
}));

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      openNewGameModal: mockOpenNewGameModal,
      openSettingsModal: mockOpenSettingsModal,
      openLeaderboardModal: mockOpenLeaderboardModal,
      openStatisticsModal: mockOpenStatisticsModal,
    }),
}));

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) =>
    selector({
      animationsEnabled: false,
    }),
}));

describe('NavBar smiley button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus = 'idle';
    mockIsPressingCell = false;
  });

  function getSmileyButton() {
    return screen.getByRole('button', { name: /new game/i });
  }

  it('shows \u{1F642} when idle', () => {
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F642}');
  });

  it('calls openNewGameModal on click', () => {
    render(<NavBar />);
    fireEvent.click(getSmileyButton());
    expect(mockOpenNewGameModal).toHaveBeenCalledTimes(1);
  });

  it('shows \u{1F642} when playing and not pressing', () => {
    mockStatus = 'playing';
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F642}');
  });

  it('shows \u{1F62E} when playing and a cell is being pressed', () => {
    mockStatus = 'playing';
    mockIsPressingCell = true;
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F62E}');
  });

  it('shows \u{1F60E} when the game is won', () => {
    mockStatus = 'won';
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F60E}');
  });

  it('shows \u{1F635} when the game is lost', () => {
    mockStatus = 'lost';
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F635}');
  });

  it('does NOT show \u{1F62E} when game is won even if a cell is pressed', () => {
    mockStatus = 'won';
    mockIsPressingCell = true;
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F60E}');
  });
});
