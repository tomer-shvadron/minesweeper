import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_KEY_BINDINGS } from '@/constants/keyboard.constants';
import { useSettingsStore } from '@/stores/settings.store';

const defaults = {
  theme: 'xp' as const,
  flagMode: 'flags-only' as const,
  soundEnabled: true,
  volume: 0.5,
  animationsEnabled: true,
  noGuessMode: false,
  keyboardBindings: DEFAULT_KEY_BINDINGS,
};

beforeEach(() => {
  useSettingsStore.setState(defaults);
});

describe('settings.store', () => {
  describe('setTheme', () => {
    it('updates theme to dark', () => {
      useSettingsStore.getState().setTheme('dark');
      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('updates theme back to xp', () => {
      useSettingsStore.setState({ theme: 'dark' });
      useSettingsStore.getState().setTheme('xp');
      expect(useSettingsStore.getState().theme).toBe('xp');
    });
  });

  describe('setFlagMode', () => {
    it('updates flagMode to flags-and-questions', () => {
      useSettingsStore.getState().setFlagMode('flags-and-questions');
      expect(useSettingsStore.getState().flagMode).toBe('flags-and-questions');
    });

    it('updates flagMode back to flags-only', () => {
      useSettingsStore.setState({ flagMode: 'flags-and-questions' });
      useSettingsStore.getState().setFlagMode('flags-only');
      expect(useSettingsStore.getState().flagMode).toBe('flags-only');
    });
  });

  describe('setSoundEnabled', () => {
    it('disables sound', () => {
      useSettingsStore.getState().setSoundEnabled(false);
      expect(useSettingsStore.getState().soundEnabled).toBe(false);
    });

    it('re-enables sound', () => {
      useSettingsStore.setState({ soundEnabled: false });
      useSettingsStore.getState().setSoundEnabled(true);
      expect(useSettingsStore.getState().soundEnabled).toBe(true);
    });
  });

  describe('setVolume', () => {
    it('updates volume', () => {
      useSettingsStore.getState().setVolume(0.8);
      expect(useSettingsStore.getState().volume).toBe(0.8);
    });

    it('can set volume to 0', () => {
      useSettingsStore.getState().setVolume(0);
      expect(useSettingsStore.getState().volume).toBe(0);
    });

    it('can set volume to 1', () => {
      useSettingsStore.getState().setVolume(1);
      expect(useSettingsStore.getState().volume).toBe(1);
    });
  });

  describe('setAnimationsEnabled', () => {
    it('disables animations', () => {
      useSettingsStore.getState().setAnimationsEnabled(false);
      expect(useSettingsStore.getState().animationsEnabled).toBe(false);
    });

    it('re-enables animations', () => {
      useSettingsStore.setState({ animationsEnabled: false });
      useSettingsStore.getState().setAnimationsEnabled(true);
      expect(useSettingsStore.getState().animationsEnabled).toBe(true);
    });
  });

  describe('initial defaults', () => {
    it('has correct default theme', () => {
      expect(useSettingsStore.getState().theme).toBe('xp');
    });

    it('has correct default flagMode', () => {
      expect(useSettingsStore.getState().flagMode).toBe('flags-only');
    });

    it('has sound enabled by default', () => {
      expect(useSettingsStore.getState().soundEnabled).toBe(true);
    });

    it('has volume at 0.5 by default', () => {
      expect(useSettingsStore.getState().volume).toBe(0.5);
    });

    it('has animations enabled by default', () => {
      expect(useSettingsStore.getState().animationsEnabled).toBe(true);
    });

    it('has noGuessMode disabled by default', () => {
      expect(useSettingsStore.getState().noGuessMode).toBe(false);
    });

    it('has default keyboard bindings', () => {
      expect(useSettingsStore.getState().keyboardBindings).toEqual(DEFAULT_KEY_BINDINGS);
    });
  });

  describe('setNoGuessMode', () => {
    it('enables no-guess mode', () => {
      useSettingsStore.getState().setNoGuessMode(true);
      expect(useSettingsStore.getState().noGuessMode).toBe(true);
    });

    it('disables no-guess mode', () => {
      useSettingsStore.setState({ noGuessMode: true });
      useSettingsStore.getState().setNoGuessMode(false);
      expect(useSettingsStore.getState().noGuessMode).toBe(false);
    });
  });

  describe('setKeyBinding', () => {
    it('updates a single key binding', () => {
      useSettingsStore.getState().setKeyBinding('moveUp', 'w');
      expect(useSettingsStore.getState().keyboardBindings.moveUp).toBe('w');
    });

    it('does not affect other bindings when updating one', () => {
      useSettingsStore.getState().setKeyBinding('flag', 'x');
      expect(useSettingsStore.getState().keyboardBindings.reveal).toBe(DEFAULT_KEY_BINDINGS.reveal);
    });
  });
});
