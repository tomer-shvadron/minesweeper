import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NavBar } from '@/components/nav/NavBar';
import type { GameStatus } from '@/types/game.types';

const { gameMock, mockOpenNewGameModal } = vi.hoisted(() => ({
  gameMock: {
    status: 'idle' as GameStatus,
    isPressingCell: false,
    config: { rows: 9, cols: 9, mines: 10 },
  },
  mockOpenNewGameModal: vi.fn(),
}));

vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) => selector(gameMock),
}));

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      openNewGameModal: mockOpenNewGameModal,
      openSettingsModal: vi.fn(),
      openLeaderboardModal: vi.fn(),
      openStatisticsModal: vi.fn(),
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
    gameMock.status = 'idle';
    gameMock.isPressingCell = false;
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
    gameMock.status = 'playing';
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F642}');
  });

  it('shows \u{1F62E} when playing and a cell is being pressed', () => {
    gameMock.status = 'playing';
    gameMock.isPressingCell = true;
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F62E}');
  });

  it('shows \u{1F60E} when the game is won', () => {
    gameMock.status = 'won';
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F60E}');
  });

  it('shows \u{1F635} when the game is lost', () => {
    gameMock.status = 'lost';
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F635}');
  });

  it('does NOT show \u{1F62E} when game is won even if a cell is pressed', () => {
    gameMock.status = 'won';
    gameMock.isPressingCell = true;
    render(<NavBar />);
    expect(getSmileyButton().textContent).toContain('\u{1F60E}');
  });
});
