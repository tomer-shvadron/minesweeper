import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsModal } from '@/components/modals/SettingsModal';
import type { FlagMode, Theme } from '@/types/settings.types';

let mockIsOpen = true;
const mockCloseSettings = vi.fn();

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      activeModal: mockIsOpen ? 'settings' : null,
      closeSettingsModal: mockCloseSettings,
    }),
}));

const mockSetTheme = vi.fn();
const mockSetFlagMode = vi.fn();
const mockSetSoundEnabled = vi.fn();
const mockSetVolume = vi.fn();
const mockSetAnimationsEnabled = vi.fn();

interface MockSettings {
  theme: Theme;
  flagMode: FlagMode;
  soundEnabled: boolean;
  volume: number;
  animationsEnabled: boolean;
  setTheme: typeof mockSetTheme;
  setFlagMode: typeof mockSetFlagMode;
  setSoundEnabled: typeof mockSetSoundEnabled;
  setVolume: typeof mockSetVolume;
  setAnimationsEnabled: typeof mockSetAnimationsEnabled;
}

let mockSettings: MockSettings = {
  theme: 'regular',
  flagMode: 'flags-only',
  soundEnabled: true,
  volume: 0.5,
  animationsEnabled: true,
  setTheme: mockSetTheme,
  setFlagMode: mockSetFlagMode,
  setSoundEnabled: mockSetSoundEnabled,
  setVolume: mockSetVolume,
  setAnimationsEnabled: mockSetAnimationsEnabled,
};

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) => selector(mockSettings),
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = true;
    mockSettings = {
      theme: 'regular',
      flagMode: 'flags-only',
      soundEnabled: true,
      volume: 0.5,
      animationsEnabled: true,
      setTheme: mockSetTheme,
      setFlagMode: mockSetFlagMode,
      setSoundEnabled: mockSetSoundEnabled,
      setVolume: mockSetVolume,
      setAnimationsEnabled: mockSetAnimationsEnabled,
    };
  });

  it('renders nothing when closed', () => {
    mockIsOpen = false;
    render(<SettingsModal />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the Settings title when open', () => {
    render(<SettingsModal />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

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

  it('shows Sound toggle checked when soundEnabled is true', () => {
    render(<SettingsModal />);
    const soundToggle = screen.getByRole('switch', { name: /sound effects/i });
    expect(soundToggle.getAttribute('data-state')).toBe('checked');
  });

  it('volume slider is enabled when sound is on', () => {
    render(<SettingsModal />);
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('data-disabled')).toBeNull();
  });

  it('volume slider is disabled when sound is off', () => {
    mockSettings = { ...mockSettings, soundEnabled: false };
    render(<SettingsModal />);
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('data-disabled')).toBe('');
  });

  it('calls closeModal when Done is clicked', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByText('Done'));
    expect(mockCloseSettings).toHaveBeenCalledTimes(1);
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

  it('calls setSoundEnabled with false when sound toggle is clicked while enabled', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('switch', { name: /sound effects/i }));
    expect(mockSetSoundEnabled).toHaveBeenCalledWith(false);
  });

  it('calls setSoundEnabled with true when sound toggle is clicked while disabled', () => {
    mockSettings = { ...mockSettings, soundEnabled: false };
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('switch', { name: /sound effects/i }));
    expect(mockSetSoundEnabled).toHaveBeenCalledWith(true);
  });

  it('shows the flag mode toggle in the Gameplay section', () => {
    render(<SettingsModal />);
    expect(screen.getByRole('switch', { name: /flag \+ question mark cycle/i })).toBeTruthy();
  });

  it('flag cycle toggle is unchecked when flagMode is flags-only', () => {
    render(<SettingsModal />);
    const toggle = screen.getByRole('switch', { name: /flag \+ question mark cycle/i });
    expect(toggle.getAttribute('data-state')).toBe('unchecked');
  });

  it('flag cycle toggle is checked when flagMode is flags-and-questions', () => {
    mockSettings = { ...mockSettings, flagMode: 'flags-and-questions' };
    render(<SettingsModal />);
    const toggle = screen.getByRole('switch', { name: /flag \+ question mark cycle/i });
    expect(toggle.getAttribute('data-state')).toBe('checked');
  });

  it('calls setFlagMode with "flags-and-questions" when flag cycle toggle is turned on', () => {
    render(<SettingsModal />);
    fireEvent.click(screen.getByRole('switch', { name: /flag \+ question mark cycle/i }));
    expect(mockSetFlagMode).toHaveBeenCalledWith('flags-and-questions');
  });
});
