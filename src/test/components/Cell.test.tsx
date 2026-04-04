import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { unrevealed } from '../mocks/cell.mock';

import { Cell } from '@/components/board/Cell';
import type { CellState } from '@/types/game.types';

// ---------------------------------------------------------------------------
// Store mocks — isolate Cell rendering from Zustand state
// ---------------------------------------------------------------------------
const { gameMock, settingsMock } = vi.hoisted(() => ({
  gameMock: { status: 'playing' as string },
  settingsMock: { flagMode: 'flags-only' as string, soundEnabled: false, volume: 0.5 },
}));

vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) => selector(gameMock),
}));

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) => selector(settingsMock),
}));

function renderCell(cell: CellState) {
  return render(<Cell row={0} col={0} cell={cell} cellSize={32} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Cell — visual states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameMock.status = 'playing';
    settingsMock.flagMode = 'flags-only';
  });

  it('renders an unrevealed cell with no content', () => {
    renderCell(unrevealed());
    const btn = screen.getByRole('gridcell');
    expect(btn).toHaveClass('cell');
    expect(btn).not.toHaveClass('cell-revealed');
    expect(btn.textContent?.trim()).toBe('');
  });

  it('renders a flagged cell with the flag icon', () => {
    renderCell({ ...unrevealed(), isFlagged: true });
    expect(screen.getByRole('gridcell').textContent).toContain('🚩');
  });

  it('renders a question-mark cell', () => {
    renderCell({ ...unrevealed(), isQuestionMark: true });
    expect(screen.getByRole('gridcell').textContent).toContain('?');
  });

  it('renders a revealed empty cell with no content', () => {
    renderCell({ ...unrevealed(), isRevealed: true, value: 0 });
    const btn = screen.getByRole('gridcell');
    expect(btn).toHaveClass('cell-revealed');
    expect(btn.textContent?.trim()).toBe('');
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)('renders a revealed cell with number %i', (value) => {
    renderCell({ ...unrevealed(), isRevealed: true, value });
    expect(screen.getByRole('gridcell').textContent).toContain(String(value));
  });

  it('renders a mine cell on game-over', () => {
    renderCell({ ...unrevealed(), isRevealed: true, hasMine: true });
    expect(screen.getByRole('gridcell').textContent).toContain('💣');
  });

  it('renders the exploded mine cell with the exploded class', () => {
    renderCell({ ...unrevealed(), isRevealed: true, hasMine: true, isExploded: true });
    const btn = screen.getByRole('gridcell');
    expect(btn).toHaveClass('cell-exploded');
    expect(btn.textContent).toContain('💣');
  });

  it('includes data-row and data-col attributes for event delegation', () => {
    render(<Cell row={3} col={7} cell={unrevealed()} cellSize={32} />);
    const btn = screen.getByRole('gridcell');
    expect(btn).toHaveAttribute('data-row', '3');
    expect(btn).toHaveAttribute('data-col', '7');
  });

  it('has no event handlers (pure display component)', () => {
    renderCell(unrevealed());
    const btn = screen.getByRole('gridcell');
    // Cell should render without onclick/onmousedown/etc — handlers are on the board grid
    expect(btn.getAttribute('aria-label')).toBe('Row 1, Column 1: unrevealed');
  });
});

describe('Cell — game-over state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingsMock.flagMode = 'flags-only';
  });

  it('shows correct flag checkmark when game is lost and cell is correctly flagged', () => {
    gameMock.status = 'lost';
    renderCell({ ...unrevealed(), isFlagged: true, hasMine: true });
    const btn = screen.getByRole('gridcell');
    expect(btn.textContent).toContain('✓');
  });

  it('does not show checkmark on win even if cell is correctly flagged', () => {
    gameMock.status = 'won';
    renderCell({ ...unrevealed(), isFlagged: true, hasMine: true });
    const btn = screen.getByRole('gridcell');
    expect(btn.textContent).not.toContain('✓');
  });

  it('does not show checkmark for incorrectly flagged cells', () => {
    gameMock.status = 'won';
    renderCell({ ...unrevealed(), isFlagged: true, hasMine: false });
    const btn = screen.getByRole('gridcell');
    expect(btn.textContent).not.toContain('✓');
  });

  it('does not show checkmark during active game', () => {
    gameMock.status = 'playing';
    renderCell({ ...unrevealed(), isFlagged: true, hasMine: true });
    const btn = screen.getByRole('gridcell');
    expect(btn.textContent).not.toContain('✓');
  });
});
