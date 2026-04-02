import type { GameStatus } from '@/types/game.types';
import type { FlagMode } from '@/types/settings.types';

export const selectIsGameOver = (s: { status: GameStatus }) =>
  s.status === 'won' || s.status === 'lost';

export const selectAllowQuestionMarks = (s: { flagMode: FlagMode }) =>
  s.flagMode === 'flags-and-questions';
