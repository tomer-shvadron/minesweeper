import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NewGameModal } from '@/components/modals/NewGameModal';

const { uiMock, gameMock, mockClose, mockStartNewGame } = vi.hoisted(() => ({
  mockClose: vi.fn(),
  mockStartNewGame: vi.fn(),
  uiMock: {
    activeModal: 'newGame' as string | null,
    closeNewGameModal: null as ReturnType<typeof vi.fn> | null,
  },
  gameMock: {
    startNewGame: null as ReturnType<typeof vi.fn> | null,
    config: { rows: 9, cols: 9, mines: 10 },
  },
}));
uiMock.closeNewGameModal = mockClose;
gameMock.startNewGame = mockStartNewGame;

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) => selector(uiMock),
}));

vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) => selector(gameMock),
}));

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) =>
    selector({ noGuessMode: false, setNoGuessMode: vi.fn() }),
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

describe('NewGameModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMock.activeModal = 'newGame';
    gameMock.config = { rows: 9, cols: 9, mines: 10 };
  });

  it('renders nothing when closed', () => {
    uiMock.activeModal = null;
    render(<NewGameModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the modal title when open', () => {
    render(<NewGameModal />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('New Game')).toBeTruthy();
  });

  it('shows all difficulty preset options', () => {
    render(<NewGameModal />);
    expect(screen.getByRole('radio', { name: /beginner/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /intermediate/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /expert/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /custom/i })).toBeTruthy();
  });

  it('pre-selects Beginner when current config matches beginner preset', () => {
    render(<NewGameModal />);
    const beginnerRadio = screen.getByRole('radio', { name: /beginner/i });
    expect(beginnerRadio.getAttribute('data-state')).toBe('checked');
  });

  it('calls startNewGame and closeModal when Start is clicked', () => {
    render(<NewGameModal />);
    fireEvent.click(screen.getByText('Start'));
    expect(mockStartNewGame).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls closeModal when Cancel is clicked', () => {
    render(<NewGameModal />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockStartNewGame).not.toHaveBeenCalled();
  });

  it('shows custom inputs when Custom preset is selected', () => {
    render(<NewGameModal />);
    fireEvent.click(screen.getByRole('radio', { name: /custom/i }));
    expect(screen.getByLabelText('Rows')).toBeTruthy();
    expect(screen.getByLabelText('Columns')).toBeTruthy();
    expect(screen.getByLabelText('Mines')).toBeTruthy();
  });

  it('does not show custom inputs when a preset is selected', () => {
    render(<NewGameModal />);
    expect(screen.queryByLabelText('Rows')).toBeNull();
  });
});

describe('NewGameModal – custom size inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMock.activeModal = 'newGame';
    // A config that doesn't match any preset → Custom is pre-selected
    gameMock.config = { rows: 10, cols: 20, mines: 15 };
  });

  function renderCustom() {
    render(<NewGameModal />);
    // Custom preset should already be selected
    return {
      rowsInput: screen.getByLabelText('Rows') as HTMLInputElement,
      colsInput: screen.getByLabelText('Columns') as HTMLInputElement,
      minesInput: screen.getByLabelText('Mines') as HTMLInputElement,
    };
  }

  it('pre-selects Custom when current config does not match any preset', () => {
    render(<NewGameModal />);
    expect(screen.getByLabelText('Rows')).toBeTruthy();
  });

  it('does NOT clamp intermediate values while the user is still typing', () => {
    const { rowsInput } = renderCustom();
    // Simulate clearing "10" and typing "1" (first keystroke of "15")
    fireEvent.change(rowsInput, { target: { value: '1' } });
    // Should show "1", not clamp to MIN_ROWS (5)
    expect(rowsInput.value).toBe('1');
  });

  it('allows typing a valid rows value and starts the game with it', () => {
    const { rowsInput } = renderCustom();
    fireEvent.change(rowsInput, { target: { value: '15' } });
    expect(rowsInput.value).toBe('15');
    fireEvent.click(screen.getByText('Start'));
    expect(mockStartNewGame).toHaveBeenCalledWith(expect.objectContaining({ rows: 15 }));
  });

  it('clamps below-minimum rows to MIN_ROWS on blur', () => {
    const { rowsInput } = renderCustom();
    fireEvent.change(rowsInput, { target: { value: '1' } });
    fireEvent.blur(rowsInput);
    expect(rowsInput.value).toBe('5');
  });

  it('clamps above-maximum rows to MAX_ROWS on blur', () => {
    const { rowsInput } = renderCustom();
    fireEvent.change(rowsInput, { target: { value: '99' } });
    fireEvent.blur(rowsInput);
    expect(rowsInput.value).toBe('30');
  });

  it('clamps out-of-range rows to valid bounds when Start is clicked', () => {
    const { rowsInput } = renderCustom();
    fireEvent.change(rowsInput, { target: { value: '99' } });
    fireEvent.click(screen.getByText('Start'));
    expect(mockStartNewGame).toHaveBeenCalledWith(expect.objectContaining({ rows: 30 }));
  });

  it('does NOT clamp intermediate cols values while typing', () => {
    const { colsInput } = renderCustom();
    fireEvent.change(colsInput, { target: { value: '2' } });
    expect(colsInput.value).toBe('2');
  });

  it('allows typing a valid cols value and starts the game with it', () => {
    const { colsInput } = renderCustom();
    fireEvent.change(colsInput, { target: { value: '25' } });
    fireEvent.click(screen.getByText('Start'));
    expect(mockStartNewGame).toHaveBeenCalledWith(expect.objectContaining({ cols: 25 }));
  });

  it('clamps cols on blur', () => {
    const { colsInput } = renderCustom();
    fireEvent.change(colsInput, { target: { value: '2' } });
    fireEvent.blur(colsInput);
    expect(colsInput.value).toBe('5');
  });

  it('does NOT clamp intermediate mines values while typing', () => {
    const { minesInput } = renderCustom();
    fireEvent.change(minesInput, { target: { value: '1' } });
    expect(minesInput.value).toBe('1');
  });

  it('allows typing a valid mines value and starts the game with it', () => {
    const { minesInput } = renderCustom();
    fireEvent.change(minesInput, { target: { value: '50' } });
    fireEvent.click(screen.getByText('Start'));
    expect(mockStartNewGame).toHaveBeenCalledWith(expect.objectContaining({ mines: 50 }));
  });

  it('clamps mines on blur', () => {
    const { minesInput } = renderCustom();
    // 10 rows × 20 cols − 9 = 191 max; try to type above that
    fireEvent.change(minesInput, { target: { value: '999' } });
    fireEvent.blur(minesInput);
    // maxMines for 10×20 = 191
    expect(Number(minesInput.value)).toBeLessThanOrEqual(191);
  });
});
