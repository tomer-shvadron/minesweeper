import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';

export const useSettingsModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeSettingsModal);
  const openKeyboardModal = useUIStore((s) => s.openKeyboardModal);

  const theme = useSettingsStore((s) => s.theme);
  const flagMode = useSettingsStore((s) => s.flagMode);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const noGuessMode = useSettingsStore((s) => s.noGuessMode);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setFlagMode = useSettingsStore((s) => s.setFlagMode);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const setAnimationsEnabled = useSettingsStore((s) => s.setAnimationsEnabled);
  const setHapticEnabled = useSettingsStore((s) => s.setHapticEnabled);
  const setNoGuessMode = useSettingsStore((s) => s.setNoGuessMode);

  // Show haptic toggle only on mobile devices with vibration support.
  // Desktop Chrome exposes navigator.vibrate (as a no-op), so we also check
  // for a coarse primary pointer which indicates a touchscreen mobile device.
  const hapticSupported =
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches;

  return {
    theme,
    flagMode,
    soundEnabled,
    volume,
    animationsEnabled,
    hapticEnabled,
    noGuessMode,
    hapticSupported,
    setTheme,
    setFlagMode,
    setSoundEnabled,
    setVolume,
    setAnimationsEnabled,
    setHapticEnabled,
    setNoGuessMode,
    openKeyboardModal,
    closeModal,
  };
};
