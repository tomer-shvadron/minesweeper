import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { DEFAULT_KEY_BINDINGS } from '@/constants/keyboard.constants';
import type { FlagMode, KeyboardAction, Settings, Theme } from '@/types/settings.types';

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
      setVolume: (volume) => set({ volume }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      setNoGuessMode: (enabled) => set({ noGuessMode: enabled }),
      setKeyBinding: (action, key) =>
        set((s) => ({ keyboardBindings: { ...s.keyboardBindings, [action]: key } })),
    }),
    { name: 'minesweeper-settings' }
  )
);
