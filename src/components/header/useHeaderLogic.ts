import { useGameLayout } from '@/hooks/useGameLayout'

export const useHeaderLogic = () => {
  const { boardWidth } = useGameLayout()
  return { boardWidth }
}
