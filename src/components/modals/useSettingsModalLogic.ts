import { useSettingsStore } from '@/stores/settings.store'
import { useUIStore } from '@/stores/ui.store'

export const useSettingsModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeSettingsModal)

  const theme = useSettingsStore((s) => s.theme)
  const flagMode = useSettingsStore((s) => s.flagMode)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const volume = useSettingsStore((s) => s.volume)
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled)
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled)

  const setTheme = useSettingsStore((s) => s.setTheme)
  const setFlagMode = useSettingsStore((s) => s.setFlagMode)
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled)
  const setVolume = useSettingsStore((s) => s.setVolume)
  const setAnimationsEnabled = useSettingsStore((s) => s.setAnimationsEnabled)
  const setHapticEnabled = useSettingsStore((s) => s.setHapticEnabled)

  // navigator.vibrate is undefined in non-touch environments (desktop browsers)
  const hapticSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  return {
    theme,
    flagMode,
    soundEnabled,
    volume,
    animationsEnabled,
    hapticEnabled,
    hapticSupported,
    setTheme,
    setFlagMode,
    setSoundEnabled,
    setVolume,
    setAnimationsEnabled,
    setHapticEnabled,
    closeModal,
  }
}
