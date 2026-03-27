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
export type SoundTheme = 'classic' | 'arcade' | 'minimal'

export interface Settings {
  theme: Theme
  flagMode: FlagMode
  soundEnabled: boolean
  volume: number // 0–1
  soundTheme: SoundTheme
  animationsEnabled: boolean
  hapticEnabled: boolean
}
