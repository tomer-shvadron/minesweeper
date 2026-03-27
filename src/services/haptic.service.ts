export type HapticPattern = 'reveal' | 'flag' | 'unflag' | 'chord' | 'win' | 'loss';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  reveal: 10,
  flag: [15, 10, 15],
  unflag: 10,
  chord: 8,
  win: [20, 15, 20, 15, 60],
  loss: [80, 30, 80],
};

export function haptic(pattern: HapticPattern, enabled: boolean): void {
  if (!enabled || !('vibrate' in navigator)) {
    return;
  }
  navigator.vibrate(PATTERNS[pattern]);
}
