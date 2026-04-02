import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cell } from '@/components/board/Cell';
import type { CellState } from '@/types/game.types';

// ---------------------------------------------------------------------------
// Store mocks — isolate Cell rendering from Zustand state
// ---------------------------------------------------------------------------
let mockGameStatus = 'playing';

vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({
      status: mockGameStatus,
    }),
}));

let mockFlagMode = 'flags-only';

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) =>
    selector({ flagMode: mockFlagMode, soundEnabled: false, volume: 0.5 }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const unrevealed = (): CellState => ({
  hasMine: false,
  isRevealed: false,
  isFlagged: false,
  isQuestionMark: false,
  value: 0,
  isExploded: false,
});

function renderCell(cell: CellState) {
  return render(<Cell row={0} col={0} cell={cell} cellSize={32} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Cell — visual states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGameStatus = 'playing';
    mockFlagMode = 'flags-only';
  });

  it('renders an unrevealed cell with no content', () => {
    renderCell(unrevealed());
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('cell');
    expect(btn).not.toHaveClass('cell-revealed');
    expect(btn.textContent?.trim()).toBe('');
  });

  it('renders a flagged cell with the flag icon', () => {
    renderCell({ ...unrevealed(), isFlagged: true });
    expect(screen.getByRole('button').textContent).toContain('🚩');
  });

  it('renders a question-mark cell', () => {
    renderCell({ ...unrevealed(), isQuestionMark: true });
    expect(screen.getByRole('button').textContent).toContain('?');
  });

  it('renders a revealed empty cell with no content', () => {
    renderCell({ ...unrevealed(), isRevealed: true, value: 0 });
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('cell-revealed');
    expect(btn.textContent?.trim()).toBe('');
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)('renders a revealed cell with number %i', (value) => {
    renderCell({ ...unrevealed(), isRevealed: true, value });
    expect(screen.getByRole('button').textContent).toContain(String(value));
  });

  it('renders a mine cell on game-over', () => {
    renderCell({ ...unrevealed(), isRevealed: true, hasMine: true });
    expect(screen.getByRole('button').textContent).toContain('💣');
  });

  it('renders the exploded mine cell with the exploded class', () => {
    renderCell({ ...unrevealed(), isRevealed: true, hasMine: true, isExploded: true });
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('cell-exploded');
    expect(btn.textContent).toContain('💣');
  });

  it('includes data-row and data-col attributes for event delegation', () => {
    render(<Cell row={3} col={7} cell={unrevealed()} cellSize={32} />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-row', '3');
    expect(btn).toHaveAttribute('data-col', '7');
  });

  it('has no event handlers (pure display component)', () => {
    renderCell(unrevealed());
    const btn = screen.getByRole('button');
    // Cell should render without onclick/onmousedown/etc — handlers are on the board grid
    expect(btn.getAttribute('aria-label')).toBe('Cell 0,0');
  });
});

describe('Cell — game-over state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFlagMode = 'flags-only';
  });

  it('shows correct flag checkmark when game is won and cell is correctly flagged', () => {
    mockGameStatus = 'won';
    renderCell({ ...unrevealed(), isFlagged: true, hasMine: true });
    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('✓');
  });

  it('does not show checkmark for incorrectly flagged cells', () => {
    mockGameStatus = 'won';
    renderCell({ ...unrevealed(), isFlagged: true, hasMine: false });
    const btn = screen.getByRole('button');
    expect(btn.textContent).not.toContain('✓');
  });

  it('does not show checkmark during active game', () => {
    mockGameStatus = 'playing';
    renderCell({ ...unrevealed(), isFlagged: true, hasMine: true });
    const btn = screen.getByRole('button');
    expect(btn.textContent).not.toContain('✓');
  });
});
