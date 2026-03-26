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
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded border-none bg-transparent leading-none outline-none active:opacity-70"
            aria-label="Leaderboard"
            onClick={openLeaderboardModal}
          >
            <Trophy size={26} strokeWidth={1.75} />
          </button>
          <MineCounter />
        </div>

        <SmileyButton />

        <div className="flex items-center justify-end gap-1">
          <Timer />
          <button
            type="button"
            className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded border-none bg-transparent leading-none outline-none active:opacity-70"
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
