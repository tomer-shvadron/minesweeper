import { type HapticPattern, haptic } from '@/services/haptic.service';
import { useSettingsStore } from '@/stores/settings.store';

export const useHaptic = () => {
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  return (pattern: HapticPattern) => {
    haptic(pattern, hapticEnabled);
  };
};
