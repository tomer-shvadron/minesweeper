import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsModal } from '@/components/modals/SettingsModal';
import type {
  BackgroundStyle,
  BoardSize,
  CellStyle,
  ColorMode,
  FlagMode,
  Theme,
} from '@/types/settings.types';

// ── UI store mock ──────────────────────────────────────────
let mockIsOpen = true;
const mockCloseSettings = vi.fn();
const mockOpenKeyboardModal = vi.fn();

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      activeModal: mockIsOpen ? 'settings' : null,
      closeSettingsModal: mockCloseSettings,
      openKeyboardModal: mockOpenKeyboardModal,
    }),
}));

// ── Game layout mock ───────────────────────────────────────
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

// ── Settings store mock ────────────────────────────────────
const mockSetTheme = vi.fn();
const mockSetColorMode = vi.fn();
const mockSetCellStyle = vi.fn();
const mockSetBackgroundStyle = vi.fn();
const mockSetFlagMode = vi.fn();
const mockSetSoundEnabled = vi.fn();
const mockSetVolume = vi.fn();
const mockSetAnimationsEnabled = vi.fn();
const mockSetHapticEnabled = vi.fn();
const mockSetNoGuessMode = vi.fn();
const mockSetBoardSize = vi.fn();

interface MockSettings {
  theme: Theme;
  colorMode: ColorMode;
  cellStyle: CellStyle;
  backgroundStyle: BackgroundStyle;
  boardSize: BoardSize;
  flagMode: FlagMode;
  soundEnabled: boolean;
  volume: number;
  animationsEnabled: boolean;
  hapticEnabled: boolean;
  noGuessMode: boolean;
  setTheme: typeof mockSetTheme;
  setColorMode: typeof mockSetColorMode;
  setCellStyle: typeof mockSetCellStyle;
  setBackgroundStyle: typeof mockSetBackgroundStyle;
  setBoardSize: typeof mockSetBoardSize;
  setFlagMode: typeof mockSetFlagMode;
  setSoundEnabled: typeof mockSetSoundEnabled;
  setVolume: typeof mockSetVolume;
  setAnimationsEnabled: typeof mockSetAnimationsEnabled;
  setHapticEnabled: typeof mockSetHapticEnabled;
  setNoGuessMode: typeof mockSetNoGuessMode;
}

const defaultMockSettings: MockSettings = {
  theme: 'regular',
  colorMode: 'system',
  cellStyle: 'rounded',
  backgroundStyle: 'gradient',
  boardSize: 'medium',
  flagMode: 'flags-only',
  soundEnabled: true,
  volume: 0.5,
  animationsEnabled: true,
  hapticEnabled: false,
  noGuessMode: false,
  setTheme: mockSetTheme,
  setColorMode: mockSetColorMode,
  setCellStyle: mockSetCellStyle,
  setBackgroundStyle: mockSetBackgroundStyle,
  setBoardSize: mockSetBoardSize,
  setFlagMode: mockSetFlagMode,
  setSoundEnabled: mockSetSoundEnabled,
  setVolume: mockSetVolume,
  setAnimationsEnabled: mockSetAnimationsEnabled,
  setHapticEnabled: mockSetHapticEnabled,
  setNoGuessMode: mockSetNoGuessMode,
};

let mockSettings: MockSettings = { ...defaultMockSettings };

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) => selector(mockSettings),
}));

// ── Helpers ────────────────────────────────────────────────

/** Click a tab by name to navigate to that settings section */
const clickTab = (name: string) => {
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(name, 'i') }));
};

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = true;
    mockSettings = { ...defaultMockSettings };
  });

  // ── Open / Close ───────────────────────────────────────

  it('renders nothing when closed', () => {
    mockIsOpen = false;
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the Settings title when open', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  // ── Appearance Tab (default) ───────────────────────────

  it('shows Theme section with Regular and Jedi options', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Regular')).toBeTruthy();
    expect(screen.getByText('Jedi')).toBeTruthy();
  });

  it('has Regular swatch pressed when theme is regular', () => {
    render(<SettingsModal />);
    const regularSwatch = screen.getByRole('button', { name: /^regular$/i });
    expect(regularSwatch.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls setTheme when Jedi swatch is clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /^jedi$/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('jedi');
  });

  it('has Jedi swatch pressed when theme is jedi', () => {
    mockSettings = { ...mockSettings, theme: 'jedi' };
    render(<SettingsModal />);
    const jediSwatch = screen.getByRole('button', { name: /^jedi$/i });
    expect(jediSwatch.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls setTheme with "regular" when Regular swatch is clicked', () => {
    mockSettings = { ...mockSettings, theme: 'jedi' };
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /^regular$/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('regular');
  });

  // ── Sound Tab ──────────────────────────────────────────

  it('shows Sound toggle checked when soundEnabled is true', () => {
    render(<SettingsModal />);
    clickTab('Sound');
    const soundToggle = screen.getByRole('switch', { name: /sound effects/i });
    expect(soundToggle.getAttribute('data-state')).toBe('checked');
  });

  it('volume slider is enabled when sound is on', () => {
    render(<SettingsModal />);
    clickTab('Sound');
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('data-disabled')).toBeNull();
  });

  it('volume slider is disabled when sound is off', () => {
    mockSettings = { ...mockSettings, soundEnabled: false };
    render(<SettingsModal />);
    clickTab('Sound');
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('data-disabled')).toBe('');
  });

  it('calls setSoundEnabled with false when sound toggle is clicked while enabled', () => {
    render(<SettingsModal />);
    clickTab('Sound');
    fireEvent.click(screen.getByRole('switch', { name: /sound effects/i }));
    expect(mockSetSoundEnabled).toHaveBeenCalledWith(false);
  });

  it('calls setSoundEnabled with true when sound toggle is clicked while disabled', () => {
    mockSettings = { ...mockSettings, soundEnabled: false };
    render(<SettingsModal />);
    clickTab('Sound');
    fireEvent.click(screen.getByRole('switch', { name: /sound effects/i }));
    expect(mockSetSoundEnabled).toHaveBeenCalledWith(true);
  });

  // ── Gameplay Tab ───────────────────────────────────────

  it('shows the flag mode toggle in the Gameplay section', () => {
    render(<SettingsModal />);
    clickTab('Gameplay');
    expect(screen.getByRole('switch', { name: /flag \+ question mark cycle/i })).toBeTruthy();
  });

  it('flag cycle toggle is unchecked when flagMode is flags-only', () => {
    render(<SettingsModal />);
    clickTab('Gameplay');
    const toggle = screen.getByRole('switch', { name: /flag \+ question mark cycle/i });
    expect(toggle.getAttribute('data-state')).toBe('unchecked');
  });

  it('flag cycle toggle is checked when flagMode is flags-and-questions', () => {
    mockSettings = { ...mockSettings, flagMode: 'flags-and-questions' };
    render(<SettingsModal />);
    clickTab('Gameplay');
    const toggle = screen.getByRole('switch', { name: /flag \+ question mark cycle/i });
    expect(toggle.getAttribute('data-state')).toBe('checked');
  });

  it('calls setFlagMode with "flags-and-questions" when flag cycle toggle is turned on', () => {
    render(<SettingsModal />);
    clickTab('Gameplay');
    fireEvent.click(screen.getByRole('switch', { name: /flag \+ question mark cycle/i }));
    expect(mockSetFlagMode).toHaveBeenCalledWith('flags-and-questions');
  });
});
