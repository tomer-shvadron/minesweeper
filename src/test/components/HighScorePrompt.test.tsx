import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HighScorePrompt } from '@/components/modals/HighScorePrompt';

// ---- ui.store mock ----
const mockDismiss = vi.fn();
const mockOpenLeaderboard = vi.fn();
let mockHighScoreEntry: { boardKey: string; timeSeconds: number } | null = null;

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      highScoreEntry: mockHighScoreEntry,
      dismissHighScorePrompt: mockDismiss,
      openLeaderboardModal: mockOpenLeaderboard,
    }),
}));

// ---- leaderboard.store mock ----
const mockAddEntry = vi.fn();

const mockLeaderboardState = { addEntry: mockAddEntry, lastPlayerName: '' };

vi.mock('@/stores/leaderboard.store', () => ({
  useLeaderboardStore: Object.assign(
    (selector: (s: object) => unknown) => selector(mockLeaderboardState),
    { getState: () => mockLeaderboardState }
  ),
}));

// ---- useGameLayout mock ----
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

describe('HighScorePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHighScoreEntry = null;
  });

  it('renders nothing when there is no high score entry', () => {
    render(<HighScorePrompt />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the prompt when a high score entry exists', () => {
    mockHighScoreEntry = { boardKey: 'beginner', timeSeconds: 42 };
    render(<HighScorePrompt />);
    expect(screen.getByText('New High Score!')).toBeTruthy();
    expect(screen.getByText(/42s/)).toBeTruthy();
  });

  it('calls addEntry and openLeaderboard when Save is clicked', () => {
    mockHighScoreEntry = { boardKey: 'beginner', timeSeconds: 42 };
    render(<HighScorePrompt />);
    const input = screen.getByPlaceholderText('Your name');
    fireEvent.change(input, { target: { value: 'Tomer' } });
    fireEvent.click(screen.getByText('Save'));
    expect(mockAddEntry).toHaveBeenCalledWith('beginner', {
      name: 'Tomer',
      timeSeconds: 42,
      date: expect.any(String),
    });
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockOpenLeaderboard).toHaveBeenCalledTimes(1);
  });

  it('uses "Anonymous" when name is blank and Save is clicked', () => {
    mockHighScoreEntry = { boardKey: 'beginner', timeSeconds: 42 };
    render(<HighScorePrompt />);
    fireEvent.click(screen.getByText('Save'));
    expect(mockAddEntry).toHaveBeenCalledWith(
      'beginner',
      expect.objectContaining({ name: 'Anonymous' })
    );
  });

  it('submits on Enter key press', () => {
    mockHighScoreEntry = { boardKey: 'beginner', timeSeconds: 42 };
    render(<HighScorePrompt />);
    const input = screen.getByPlaceholderText('Your name');
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockAddEntry).toHaveBeenCalledTimes(1);
  });

  it('calls dismissHighScorePrompt when Skip is clicked', () => {
    mockHighScoreEntry = { boardKey: 'beginner', timeSeconds: 42 };
    render(<HighScorePrompt />);
    fireEvent.click(screen.getByText('Skip'));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockAddEntry).not.toHaveBeenCalled();
    expect(mockOpenLeaderboard).not.toHaveBeenCalled();
  });
});
