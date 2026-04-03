import { useGameLayout } from '@/hooks/useGameLayout';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';

export const useSettingsModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeSettingsModal);
  const openKeyboardModal = useUIStore((s) => s.openKeyboardModal);
  const { layoutMode } = useGameLayout();

  const theme = useSettingsStore((s) => s.theme);
  const colorMode = useSettingsStore((s) => s.colorMode);
  const cellStyle = useSettingsStore((s) => s.cellStyle);
  const backgroundStyle = useSettingsStore((s) => s.backgroundStyle);
  const flagMode = useSettingsStore((s) => s.flagMode);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);
  const noGuessMode = useSettingsStore((s) => s.noGuessMode);
  const boardSize = useSettingsStore((s) => s.boardSize);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setColorMode = useSettingsStore((s) => s.setColorMode);
  const setCellStyle = useSettingsStore((s) => s.setCellStyle);
  const setBackgroundStyle = useSettingsStore((s) => s.setBackgroundStyle);
  const setFlagMode = useSettingsStore((s) => s.setFlagMode);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const setAnimationsEnabled = useSettingsStore((s) => s.setAnimationsEnabled);
  const setHapticEnabled = useSettingsStore((s) => s.setHapticEnabled);
  const setNoGuessMode = useSettingsStore((s) => s.setNoGuessMode);
  const setBoardSize = useSettingsStore((s) => s.setBoardSize);

  // Show haptic toggle only on mobile devices with vibration support.
  const hapticSupported =
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches;

  return {
    layoutMode,
    theme,
    colorMode,
    cellStyle,
    backgroundStyle,
    flagMode,
    soundEnabled,
    volume,
    animationsEnabled,
    hapticEnabled,
    noGuessMode,
    boardSize,
    hapticSupported,
    setTheme,
    setColorMode,
    setCellStyle,
    setBackgroundStyle,
    setFlagMode,
    setSoundEnabled,
    setVolume,
    setAnimationsEnabled,
    setHapticEnabled,
    setNoGuessMode,
    setBoardSize,
    openKeyboardModal,
    closeModal,
  };
};
