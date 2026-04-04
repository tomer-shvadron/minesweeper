export type Theme = 'light' | 'dark' | 'jedi' | 'sith';
export type CellStyle = 'rounded';
export type BackgroundStyle = 'gradient' | 'pattern' | 'dynamic' | 'solid';
export type BoardSize = 'small' | 'medium' | 'large';
export type LayoutMode = 'mobile-portrait' | 'mobile-landscape' | 'desktop';
export type FlagMode = 'flags-only' | 'flags-and-questions';
export type SoundTheme = 'classic' | 'arcade' | 'minimal' | 'starwars';
export type KeyboardAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'reveal'
  | 'flag'
  | 'chord'
  | 'newGame';

export interface Settings {
  theme: Theme;
  cellStyle: CellStyle;
  backgroundStyle: BackgroundStyle;
  boardSize: BoardSize;
  flagMode: FlagMode;
  soundEnabled: boolean;
  volume: number; // 0–1
  animationsEnabled: boolean;
  hapticEnabled: boolean;
  noGuessMode: boolean;
  keyboardBindings: Record<KeyboardAction, string>;
}
