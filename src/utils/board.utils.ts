import type { BoardKey } from '@/types/game.types';

/** The standard preset board keys. */
export const PRESET_BOARD_KEYS: BoardKey[] = ['beginner', 'intermediate', 'expert'];

const PRESET_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Expert',
};

/** Format a board key into a human-readable label (e.g. "Beginner" or "Custom (10x10x15)"). */
export function formatBoardKeyLabel(key: BoardKey): string {
  return PRESET_LABELS[key] ?? `Custom (${key})`;
}
