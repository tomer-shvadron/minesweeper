import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsModal } from '@/components/modals/SettingsModal';

// ── Hoisted mocks ────────────────────────────────────────────
const {
  uiMock,
  settingsDefaults,
  settingsMock,
  mockSetTheme,
  mockSetFlagMode,
  mockSetSoundEnabled,
} = vi.hoisted(() => {
  const mockSetTheme = vi.fn();
  const mockSetBackgroundStyle = vi.fn();
  const mockSetFlagMode = vi.fn();
  const mockSetSoundEnabled = vi.fn();
  const mockSetVolume = vi.fn();
  const mockSetAnimationsEnabled = vi.fn();
  const mockSetHapticEnabled = vi.fn();
  const mockSetNoGuessMode = vi.fn();
  const mockSetBoardSize = vi.fn();

  const settingsDefaults = {
    theme: 'light' as string,
    backgroundStyle: 'gradient' as string,
    boardSize: 'medium' as string,
    flagMode: 'flags-only' as string,
    soundEnabled: true,
    volume: 0.5,
    animationsEnabled: true,
    hapticEnabled: false,
    noGuessMode: false,
    setTheme: mockSetTheme,
    setBackgroundStyle: mockSetBackgroundStyle,
    setBoardSize: mockSetBoardSize,
    setFlagMode: mockSetFlagMode,
    setSoundEnabled: mockSetSoundEnabled,
    setVolume: mockSetVolume,
    setAnimationsEnabled: mockSetAnimationsEnabled,
    setHapticEnabled: mockSetHapticEnabled,
    setNoGuessMode: mockSetNoGuessMode,
  };

  const settingsMock = { ...settingsDefaults };

  return {
    uiMock: {
      activeModal: 'settings' as string | null,
      closeSettingsModal: vi.fn(),
      openKeyboardModal: vi.fn(),
    },
    settingsDefaults,
    settingsMock,
    mockSetTheme,
    mockSetFlagMode,
    mockSetSoundEnabled,
  };
});

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) => selector(uiMock),
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

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) => selector(settingsMock),
}));

// ── Helpers ────────────────────────────────────────────────

/** Click a tab by name to navigate to that settings section */
const clickTab = (name: string) => {
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(name, 'i') }));
};

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uiMock.activeModal = 'settings';
    Object.assign(settingsMock, settingsDefaults);
  });

  // ── Open / Close ───────────────────────────────────────

  it('renders nothing when closed', () => {
    uiMock.activeModal = null;
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the Settings title when open', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  // ── Appearance Tab (default) ───────────────────────────

  it('shows Theme section with Light, Dark, and Jedi options', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Light')).toBeTruthy();
    expect(screen.getByText('Dark')).toBeTruthy();
    expect(screen.getByText('Jedi')).toBeTruthy();
  });

  it('has Light swatch pressed when theme is light', () => {
    render(<SettingsModal />);
    const lightSwatch = screen.getByRole('button', { name: /^light$/i });
    expect(lightSwatch.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls setTheme when Jedi swatch is clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /^jedi$/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('jedi');
  });

  it('has Jedi swatch pressed when theme is jedi', () => {
    settingsMock.theme = 'jedi';
    render(<SettingsModal />);
    const jediSwatch = screen.getByRole('button', { name: /^jedi$/i });
    expect(jediSwatch.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls setTheme with "light" when Light swatch is clicked', () => {
    settingsMock.theme = 'jedi';
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('button', { name: /^light$/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
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
    settingsMock.soundEnabled = false;
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
    settingsMock.soundEnabled = false;
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
    settingsMock.flagMode = 'flags-and-questions';
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
