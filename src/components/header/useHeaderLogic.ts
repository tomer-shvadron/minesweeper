import { useGameLayout } from '@/hooks/useGameLayout'
import { useUIStore } from '@/stores/ui.store'

export const useHeaderLogic = () => {
  const { boardWidth, boardHeight, isLandscape, headerSidebarWidth } = useGameLayout()
  const openSettingsModal = useUIStore((s) => s.openSettingsModal)
  const openLeaderboardModal = useUIStore((s) => s.openLeaderboardModal)
  const openStatisticsModal = useUIStore((s) => s.openStatisticsModal)
  return {
    boardWidth,
    boardHeight,
    isLandscape,
    headerSidebarWidth,
    openSettingsModal,
    openLeaderboardModal,
    openStatisticsModal,
  }
}
