import type { SoundTheme, Theme } from '@/types/settings.types';

export const THEMES: readonly Theme[] = [
  'xp',
  'dark',
  'material',
  'aero',
  'pastel',
  'neon',
  'aqua',
  'jedi',
  'sith',
];

export const THEME_LABELS: Record<Theme, string> = {
  xp: 'Classic XP',
  dark: 'Dark',
  material: 'Material',
  aero: 'Aero',
  pastel: 'Pastel',
  neon: 'Neon',
  aqua: 'Aqua',
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
  xp: { surface: '#c0c0c0', accent: '#000080' },
  dark: { surface: '#1c1c28', accent: '#6366f1' },
  material: { surface: '#2d2d2d', accent: '#bb86fc' },
  aero: { surface: '#d2e6fa', accent: '#1e6fcc' },
  pastel: { surface: '#fef5e4', accent: '#7c3ca0' },
  neon: { surface: '#220040', accent: '#ff00ff' },
  aqua: { surface: '#ebebeb', accent: '#007aff' },
  jedi: { surface: '#cce0f0', accent: '#0066cc' },
  sith: { surface: '#1e000e', accent: '#cc0000' },
};
