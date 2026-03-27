import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SmileyButton } from '@/components/header/SmileyButton';
import type { GameStatus } from '@/types/game.types';

const mockOpenNewGameModal = vi.fn();

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
    selector({ openNewGameModal: mockOpenNewGameModal }),
}));

describe('SmileyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus = 'idle';
    mockIsPressingCell = false;
  });

  it('shows 🙂 when idle', () => {
    render(<SmileyButton />);
    expect(screen.getByRole('button').textContent).toContain('🙂');
  });

  it('calls openNewGameModal on click', () => {
    render(<SmileyButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOpenNewGameModal).toHaveBeenCalledTimes(1);
  });

  it('shows 🙂 when playing and not pressing', () => {
    mockStatus = 'playing';
    render(<SmileyButton />);
    expect(screen.getByRole('button').textContent).toContain('🙂');
  });

  it('shows 😮 when playing and a cell is being pressed', () => {
    mockStatus = 'playing';
    mockIsPressingCell = true;
    render(<SmileyButton />);
    expect(screen.getByRole('button').textContent).toContain('😮');
  });

  it('shows 😎 when the game is won', () => {
    mockStatus = 'won';
    render(<SmileyButton />);
    expect(screen.getByRole('button').textContent).toContain('😎');
  });

  it('shows 😵 when the game is lost', () => {
    mockStatus = 'lost';
    render(<SmileyButton />);
    expect(screen.getByRole('button').textContent).toContain('😵');
  });

  it('does NOT show 😮 when game is won even if a cell is pressed', () => {
    mockStatus = 'won';
    mockIsPressingCell = true;
    render(<SmileyButton />);
    expect(screen.getByRole('button').textContent).toContain('😎');
  });
});
