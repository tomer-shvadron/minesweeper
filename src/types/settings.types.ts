export type Theme =
  | 'xp'
  | 'dark'
  | 'material'
  | 'aero'
  | 'pastel'
  | 'neon'
  | 'aqua'
  | 'jedi'
  | 'sith'
export type FlagMode = 'flags-only' | 'flags-and-questions'
export type SoundTheme = 'classic' | 'arcade' | 'minimal' | 'starwars'
export type KeyboardAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'reveal'
  | 'flag'
  | 'chord'
  | 'newGame'

export interface Settings {
  theme: Theme
  flagMode: FlagMode
  soundEnabled: boolean
  volume: number // 0–1
  animationsEnabled: boolean
  hapticEnabled: boolean
  noGuessMode: boolean
  keyboardBindings: Record<KeyboardAction, string>
}
