import type { SoundTheme, Theme } from '@/types/settings.types';

export const THEMES: readonly Theme[] = ['light', 'dark', 'jedi', 'sith'];

export const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  jedi: 'Jedi',
  sith: 'Sith',
};

/** Maps each visual theme to its sound theme. Star Wars themes get Star Wars sounds; everything else gets classic. */
export function soundThemeForTheme(theme: Theme): SoundTheme {
  if (theme === 'jedi' || theme === 'sith') {
    return 'starwars';
  }
  return 'classic';
}

export const THEME_PREVIEW: Record<Theme, { surface: string; accent: string }> = {
  light: { surface: '#ffffff', accent: '#6366f1' },
  dark: { surface: '#1c1c2e', accent: '#818cf8' },
  jedi: { surface: '#0a1628', accent: '#4da6ff' },
  sith: { surface: '#1a0008', accent: '#ff4444' },
};

/** Maps old theme names to their current equivalents for migration. */
export const LEGACY_THEME_MAP: Record<string, Theme> = {
  regular: 'light',
  'regular-dark': 'dark',
  xp: 'light',
  dark: 'dark',
  material: 'light',
  aero: 'light',
  pastel: 'light',
  neon: 'light',
  aqua: 'light',
  'liquid-glass': 'light',
  jedi: 'jedi',
  sith: 'sith',
};
