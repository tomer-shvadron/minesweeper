import { useShallow } from 'zustand/react/shallow';

import { useGameLayout } from '@/hooks/useGameLayout';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';

export const useSettingsModalLogic = () => {
  const closeModal = useUIStore((s) => s.closeSettingsModal);
  const openKeyboardModal = useUIStore((s) => s.openKeyboardModal);
  const { layoutMode } = useGameLayout();

  const {
    theme,
    backgroundStyle,
    flagMode,
    soundEnabled,
    volume,
    animationsEnabled,
    hapticEnabled,
    noGuessMode,
    boardSize,
    setTheme,
    setBackgroundStyle,
    setFlagMode,
    setSoundEnabled,
    setVolume,
    setAnimationsEnabled,
    setHapticEnabled,
    setNoGuessMode,
    setBoardSize,
  } = useSettingsStore(
    useShallow((s) => ({
      theme: s.theme,
      backgroundStyle: s.backgroundStyle,
      flagMode: s.flagMode,
      soundEnabled: s.soundEnabled,
      volume: s.volume,
      animationsEnabled: s.animationsEnabled,
      hapticEnabled: s.hapticEnabled,
      noGuessMode: s.noGuessMode,
      boardSize: s.boardSize,
      setTheme: s.setTheme,
      setBackgroundStyle: s.setBackgroundStyle,
      setFlagMode: s.setFlagMode,
      setSoundEnabled: s.setSoundEnabled,
      setVolume: s.setVolume,
      setAnimationsEnabled: s.setAnimationsEnabled,
      setHapticEnabled: s.setHapticEnabled,
      setNoGuessMode: s.setNoGuessMode,
      setBoardSize: s.setBoardSize,
    }))
  );

  // Show haptic toggle only on mobile devices with vibration support.
  const hapticSupported =
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches;

  return {
    layoutMode,
    theme,
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
