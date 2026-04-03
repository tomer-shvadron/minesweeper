import type { ColorMode, ResolvedTheme, SoundTheme, Theme } from '@/types/settings.types';

export const THEMES: readonly Theme[] = ['regular', 'liquid-glass', 'jedi', 'sith'];

export const THEME_LABELS: Record<Theme, string> = {
  regular: 'Regular',
  'liquid-glass': 'Liquid Glass',
  jedi: 'Jedi',
  sith: 'Sith',
};

/** Themes that support both light and dark variants. */
export const THEME_SUPPORTS_COLOR_MODE: Record<Theme, boolean> = {
  regular: true,
  'liquid-glass': true,
  jedi: false,
  sith: false,
};

/** Maps each visual theme to its sound theme. Star Wars themes get Star Wars sounds; everything else gets classic. */
export function soundThemeForTheme(theme: Theme): SoundTheme {
  if (theme === 'jedi' || theme === 'sith') {
    return 'starwars';
  }
  return 'classic';
}

/** Resolves the CSS data-theme value from a base theme + color mode + system preference. */
export function resolveTheme(
  theme: Theme,
  colorMode: ColorMode,
  systemPrefersDark: boolean
): ResolvedTheme {
  // Jedi and Sith are dark-only — always return as-is
  if (!THEME_SUPPORTS_COLOR_MODE[theme]) {
    return theme as ResolvedTheme;
  }

  const isDark = colorMode === 'dark' || (colorMode === 'system' && systemPrefersDark);

  if (isDark) {
    return `${theme}-dark` as ResolvedTheme;
  }
  return theme as ResolvedTheme;
}

export const THEME_PREVIEW: Record<Theme, { surface: string; accent: string }> = {
  regular: { surface: '#ffffff', accent: '#6366f1' },
  'liquid-glass': { surface: 'rgba(255,255,255,0.5)', accent: '#007aff' },
  jedi: { surface: '#0a1628', accent: '#4da6ff' },
  sith: { surface: '#1a0008', accent: '#ff4444' },
};

/** Maps old V3 theme names to their V4 equivalents for migration. */
export const LEGACY_THEME_MAP: Record<string, Theme> = {
  xp: 'regular',
  dark: 'regular',
  material: 'regular',
  aero: 'regular',
  pastel: 'regular',
  neon: 'regular',
  aqua: 'regular',
  jedi: 'jedi',
  sith: 'sith',
};
