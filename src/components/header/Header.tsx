import { Settings, Trophy } from 'lucide-react'

import { MineCounter } from './MineCounter'
import { SmileyButton } from './SmileyButton'
import { Timer } from './Timer'
import { useHeaderLogic } from './useHeaderLogic'

export const Header = () => {
  const {
    boardWidth,
    boardHeight,
    isLandscape,
    headerSidebarWidth,
    openSettingsModal,
    openLeaderboardModal,
  } = useHeaderLogic()

  const headerStyle = isLandscape
    ? { width: headerSidebarWidth, height: boardHeight }
    : { width: boardWidth }

  return (
    <div
      className={isLandscape ? 'game-header game-header--sidebar' : 'game-header'}
      style={headerStyle}
    >
      <div className="game-header__inner">
        <div className="header-section">
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Leaderboard"
            onClick={openLeaderboardModal}
          >
            <Trophy size={26} strokeWidth={1.75} />
          </button>
          <MineCounter />
        </div>

        <SmileyButton />

        <div className="header-section header-section--right">
          <Timer />
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Settings"
            onClick={openSettingsModal}
          >
            <Settings size={26} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}
