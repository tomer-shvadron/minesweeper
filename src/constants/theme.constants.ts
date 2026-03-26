import type { Theme } from '@/types/settings.types'

export const THEMES: readonly Theme[] = ['xp', 'dark', 'material', 'aero', 'pastel', 'neon', 'aqua']

export const THEME_LABELS: Record<Theme, string> = {
  xp: 'Classic XP',
  dark: 'Dark',
  material: 'Material',
  aero: 'Aero',
  pastel: 'Pastel',
  neon: 'Neon',
  aqua: 'Aqua',
}

export const THEME_PREVIEW: Record<Theme, { surface: string; accent: string }> = {
  xp: { surface: '#c0c0c0', accent: '#000080' },
  dark: { surface: '#1c1c28', accent: '#6366f1' },
  material: { surface: '#2d2d2d', accent: '#bb86fc' },
  aero: { surface: '#d2e6fa', accent: '#1e6fcc' },
  pastel: { surface: '#fef5e4', accent: '#c9a0e8' },
  neon: { surface: '#220040', accent: '#ff00ff' },
  aqua: { surface: '#ebebeb', accent: '#007aff' },
}
