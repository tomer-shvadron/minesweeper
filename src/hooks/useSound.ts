import { soundThemeForTheme } from '@/constants/theme.constants';
import { type SoundName, type SoundOptions, playSound } from '@/services/sound.service';
import { useSettingsStore } from '@/stores/settings.store';

export const useSound = () => {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const volume = useSettingsStore((s) => s.volume);
  const theme = useSettingsStore((s) => s.theme);
  const soundTheme = soundThemeForTheme(theme);

  return (name: SoundName, options?: Omit<SoundOptions, 'soundTheme'>) => {
    if (soundEnabled) {
      playSound(name, volume, { ...options, soundTheme });
    }
  };
};
