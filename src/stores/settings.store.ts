import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_KEY_BINDINGS } from '@/constants/keyboard.constants';
import { STORAGE_KEYS } from '@/constants/storage.constants';
import type { FlagMode, KeyboardAction, Settings, Theme } from '@/types/settings.types';

const VALID_THEMES = new Set<Theme>([
  'xp',
  'dark',
  'material',
  'aero',
  'pastel',
  'neon',
  'aqua',
  'jedi',
  'sith',
]);
const VALID_FLAG_MODES = new Set<FlagMode>(['flags-only', 'flags-and-questions']);

function isValidPersistedSettings(persisted: unknown): boolean {
  if (!persisted || typeof persisted !== 'object') {
    return false;
  }
  const s = persisted as Record<string, unknown>;

  if (typeof s.theme === 'string' && !VALID_THEMES.has(s.theme as Theme)) {
    return false;
  }
  if (typeof s.flagMode === 'string' && !VALID_FLAG_MODES.has(s.flagMode as FlagMode)) {
    return false;
  }
  if (
    typeof s.volume === 'number' &&
    (!Number.isFinite(s.volume) || s.volume < 0 || s.volume > 1)
  ) {
    return false;
  }
  if (s.soundEnabled !== undefined && typeof s.soundEnabled !== 'boolean') {
    return false;
  }
  if (s.animationsEnabled !== undefined && typeof s.animationsEnabled !== 'boolean') {
    return false;
  }

  return true;
}

type SettingsStore = Settings & {
  setTheme: (theme: Theme) => void;
  setFlagMode: (mode: FlagMode) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setNoGuessMode: (enabled: boolean) => void;
  setKeyBinding: (action: KeyboardAction, key: string) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'xp',
      flagMode: 'flags-only',
      soundEnabled: true,
      volume: 0.5,
      animationsEnabled: true,
      hapticEnabled: true,
      noGuessMode: false,
      keyboardBindings: DEFAULT_KEY_BINDINGS,

      setTheme: (theme) => set({ theme }),
      setFlagMode: (mode) => set({ flagMode: mode }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      setNoGuessMode: (enabled) => set({ noGuessMode: enabled }),
      setKeyBinding: (action, key) =>
        set((s) => ({ keyboardBindings: { ...s.keyboardBindings, [action]: key } })),
    }),
    {
      name: STORAGE_KEYS.settings,
      partialize: (s) => ({
        theme: s.theme,
        flagMode: s.flagMode,
        soundEnabled: s.soundEnabled,
        volume: s.volume,
        animationsEnabled: s.animationsEnabled,
        hapticEnabled: s.hapticEnabled,
        noGuessMode: s.noGuessMode,
        keyboardBindings: s.keyboardBindings,
      }),
      merge: (persisted, current) => {
        if (!isValidPersistedSettings(persisted)) {
          return current;
        }
        return { ...current, ...(persisted as object) };
      },
    }
  )
);
