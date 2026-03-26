export type Theme = 'xp' | 'dark' | 'material' | 'aero' | 'pastel' | 'neon' | 'aqua'
export type FlagMode = 'flags-only' | 'flags-and-questions'

export interface Settings {
  theme: Theme
  flagMode: FlagMode
  soundEnabled: boolean
  volume: number // 0–1
  animationsEnabled: boolean
  hapticEnabled: boolean
}
