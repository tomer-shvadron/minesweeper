import { useGameStore } from '@/stores/game.store'

export const useMineCounterLogic = () => {
  const minesRemaining = useGameStore((s) => s.minesRemaining)
  return { minesRemaining }
}
