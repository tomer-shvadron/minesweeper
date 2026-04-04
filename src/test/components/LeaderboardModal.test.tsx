import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeaderboardModal } from '@/components/modals/LeaderboardModal';

const { uiMock, leaderboardMock } = vi.hoisted(() => ({
  uiMock: {
    activeModal: 'leaderboard' as string | null,
    closeLeaderboardModal: vi.fn(),
  },
  leaderboardMock: {
    entries: {} as Record<string, unknown[]>,
    gamesPlayed: {} as Record<string, number>,
  },
}));

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) => selector(uiMock),
}));

vi.mock('@/stores/leaderboard.store', () => ({
  useLeaderboardStore: (selector: (s: object) => unknown) => selector(leaderboardMock),
}));

vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({ config: { rows: 9, cols: 9, mines: 10 } }),
}));

vi.mock('@/stores/stats.store', () => ({
  useStatsStore: (selector: (s: object) => unknown) => selector({ records: [] }),
}));

vi.mock('@/hooks/useGameLayout', () => ({
  useGameLayout: () => ({
    layoutMode: 'mobile-portrait' as const,
    cellSize: 32,
    boardWidth: 288,
    boardHeight: 288,
    showTopBar: false,
    showBottomNav: true,
    showFloatingPills: true,
    topBarHeight: 0,
    navBarHeight: 64,
    config: { rows: 9, cols: 9, mines: 10 },
  }),
}));

describe('LeaderboardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMock.activeModal = 'leaderboard';
    leaderboardMock.entries = {};
    leaderboardMock.gamesPlayed = {};
  });

  it('renders nothing when closed', () => {
    uiMock.activeModal = null;
    render(<LeaderboardModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the Best Times title when open', () => {
    render(<LeaderboardModal />);
    expect(screen.getByText('Best Times')).toBeTruthy();
  });

  it('shows default preset tabs', () => {
    render(<LeaderboardModal />);
    expect(screen.getByText('Beginner')).toBeTruthy();
    expect(screen.getByText('Intermediate')).toBeTruthy();
    expect(screen.getByText('Expert')).toBeTruthy();
  });

  it('shows "No scores yet" when leaderboard is empty', () => {
    render(<LeaderboardModal />);
    expect(screen.getByText(/play a game/i)).toBeTruthy();
  });

  it('renders scores when entries exist', () => {
    leaderboardMock.entries = {
      beginner: [{ name: 'Alice', timeSeconds: 45, date: '2025-01-01T00:00:00.000Z' }],
    };
    render(<LeaderboardModal />);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('45s')).toBeTruthy();
  });

  it('does not show Clear or Close buttons', () => {
    render(<LeaderboardModal />);
    expect(screen.queryByText('Clear')).toBeNull();
    expect(screen.queryByText('Close')).toBeNull();
  });

  it('switches tab when another tab is clicked', () => {
    render(<LeaderboardModal />);
    const expertTab = screen.getByText('Expert');
    fireEvent.click(expertTab);
    expect(expertTab.getAttribute('aria-selected')).toBe('true');
  });
});
