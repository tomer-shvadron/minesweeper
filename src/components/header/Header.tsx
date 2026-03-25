import { MineCounter } from './MineCounter'
import { SmileyButton } from './SmileyButton'
import { Timer } from './Timer'
import { useHeaderLogic } from './useHeaderLogic'

export const Header = () => {
  const { boardWidth, openSettingsModal, openLeaderboardModal } = useHeaderLogic()

  return (
    <div className="game-header" style={{ width: boardWidth }}>
      <div className="game-header__inner">
        {/* Left: leaderboard icon + mine counter */}
        <div className="header-section">
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Leaderboard"
            onClick={openLeaderboardModal}
          >
            🏆
          </button>
          <MineCounter />
        </div>

        {/* Center: smiley (opens new-game modal) */}
        <SmileyButton />

        {/* Right: timer + settings icon */}
        <div className="header-section header-section--right">
          <Timer />
          <button
            type="button"
            className="header-icon-btn"
            aria-label="Settings"
            onClick={openSettingsModal}
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  )
}
