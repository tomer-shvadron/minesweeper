import { useGameLayout } from '@/hooks/useGameLayout';
import { useGameStore } from '@/stores/game.store';

export const useFloatingPillsLogic = () => {
  const minesRemaining = useGameStore((s) => s.minesRemaining);
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds);
  const { boardWidth } = useGameLayout();

  // Scale pill sizes proportionally to board width.
  // Baseline: boardWidth ~350px → fontSize 24px, iconSize 22px.
  // Clamp to reasonable min/max range.
  const scaleFactor = Math.max(0.7, Math.min(1.4, boardWidth / 350));
  const fontSize = Math.round(24 * scaleFactor);
  const iconSize = Math.round(22 * scaleFactor);
  const paddingX = Math.round(16 * scaleFactor);
  const paddingY = Math.round(8 * scaleFactor);
  const gap = Math.round(8 * scaleFactor);

  return {
    minesRemaining,
    elapsedSeconds,
    fontSize,
    iconSize,
    paddingX,
    paddingY,
    gap,
  };
};
