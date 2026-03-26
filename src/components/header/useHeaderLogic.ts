import { useGameLayout } from '@/hooks/useGameLayout'
import { useUIStore } from '@/stores/ui.store'

export const useHeaderLogic = () => {
  const { boardWidth, isLandscape, headerSidebarWidth } = useGameLayout()
  const openSettingsModal = useUIStore((s) => s.openSettingsModal)
  const openLeaderboardModal = useUIStore((s) => s.openLeaderboardModal)
  return { boardWidth, isLandscape, headerSidebarWidth, openSettingsModal, openLeaderboardModal }
}
