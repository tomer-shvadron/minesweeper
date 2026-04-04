import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_KEY_BINDINGS } from '@/constants/keyboard.constants';
import { STORAGE_KEYS } from '@/constants/storage.constants';
import { LEGACY_THEME_MAP } from '@/constants/theme.constants';
import { createSafeMerge } from '@/stores/persist-helpers';
import { safeStorage } from '@/stores/safe-storage';
import type {
  BackgroundStyle,
  BoardSize,
  CellStyle,
  FlagMode,
  KeyboardAction,
  Settings,
  Theme,
} from '@/types/settings.types';

const VALID_THEMES = new Set<Theme>(['light', 'dark', 'jedi', 'sith']);
const VALID_FLAG_MODES = new Set<FlagMode>(['flags-only', 'flags-and-questions']);
const VALID_CELL_STYLES = new Set<CellStyle>(['rounded']);
const VALID_BG_STYLES = new Set<BackgroundStyle>(['gradient', 'pattern', 'dynamic', 'solid']);
const VALID_BOARD_SIZES = new Set<BoardSize>(['small', 'medium', 'large']);

/** Migrate legacy theme names to current equivalents. Returns the theme unchanged if already valid. */
function migrateTheme(raw: unknown): Theme | undefined {
  if (typeof raw !== 'string') {
    return undefined;
  }
  if (VALID_THEMES.has(raw as Theme)) {
    return raw as Theme;
  }
  const mapped = LEGACY_THEME_MAP[raw];
  return mapped ?? undefined;
}

function isValidPersistedSettings(persisted: unknown): boolean {
  if (!persisted || typeof persisted !== 'object') {
    return false;
  }
  const s = persisted as Record<string, unknown>;

  // Validate theme — allow legacy values (they'll be migrated)
  if (typeof s.theme === 'string') {
    const migrated = migrateTheme(s.theme);
    if (migrated === undefined) {
      return false;
    }
  }
  if (typeof s.flagMode === 'string' && !VALID_FLAG_MODES.has(s.flagMode as FlagMode)) {
    return false;
  }
  if (typeof s.cellStyle === 'string' && !VALID_CELL_STYLES.has(s.cellStyle as CellStyle)) {
    return false;
  }
  if (
    typeof s.backgroundStyle === 'string' &&
    !VALID_BG_STYLES.has(s.backgroundStyle as BackgroundStyle)
  ) {
    return false;
  }
  if (typeof s.boardSize === 'string' && !VALID_BOARD_SIZES.has(s.boardSize as BoardSize)) {
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
  setCellStyle: (style: CellStyle) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setBoardSize: (size: BoardSize) => void;
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
      theme: 'light',
      cellStyle: 'rounded',
      backgroundStyle: 'gradient',
      boardSize: 'medium',
      flagMode: 'flags-only',
      soundEnabled: true,
      volume: 0.5,
      animationsEnabled: true,
      hapticEnabled: true,
      noGuessMode: false,
      keyboardBindings: DEFAULT_KEY_BINDINGS,

      setTheme: (theme) => set({ theme }),
      setCellStyle: (style) => set({ cellStyle: style }),
      setBackgroundStyle: (style) => set({ backgroundStyle: style }),
      setBoardSize: (size) => set({ boardSize: size }),
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
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        theme: s.theme,
        cellStyle: s.cellStyle,
        backgroundStyle: s.backgroundStyle,
        boardSize: s.boardSize,
        flagMode: s.flagMode,
        soundEnabled: s.soundEnabled,
        volume: s.volume,
        animationsEnabled: s.animationsEnabled,
        hapticEnabled: s.hapticEnabled,
        noGuessMode: s.noGuessMode,
        keyboardBindings: s.keyboardBindings,
      }),
      merge: createSafeMerge<SettingsStore>(isValidPersistedSettings, (p) => {
        // Migrate legacy theme names on hydration
        if (typeof p.theme === 'string') {
          const migrated = migrateTheme(p.theme);
          if (migrated !== undefined) {
            p.theme = migrated;
          }
        }
        // Migrate old colorMode: if user had 'regular' + 'dark'/'system' (dark), map to 'dark'
        const raw = p as Record<string, unknown>;
        if (raw.colorMode !== undefined) {
          const cm = raw.colorMode as string;
          if (
            p.theme === 'light' &&
            (cm === 'dark' ||
              (cm === 'system' &&
                typeof window !== 'undefined' &&
                window.matchMedia?.('(prefers-color-scheme: dark)').matches))
          ) {
            p.theme = 'dark';
          }
          delete raw.colorMode;
        }
        return p;
      }),
    }
  )
);
