import type { KeyboardAction } from '@/types/settings.types';

export const DEFAULT_KEY_BINDINGS: Record<KeyboardAction, string> = {
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  reveal: ' ',
  flag: 'f',
  chord: 'Enter',
  newGame: 'n',
};

export const KEYBOARD_ACTION_LABELS: Record<KeyboardAction, string> = {
  moveUp: 'Move up',
  moveDown: 'Move down',
  moveLeft: 'Move left',
  moveRight: 'Move right',
  reveal: 'Reveal cell',
  flag: 'Flag cell',
  chord: 'Chord (auto-reveal)',
  newGame: 'New game',
};
