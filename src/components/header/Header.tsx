import { MineCounter } from './MineCounter'
import { SmileyButton } from './SmileyButton'
import { Timer } from './Timer'
import { useHeaderLogic } from './useHeaderLogic'

export const Header = () => {
  const { boardWidth } = useHeaderLogic()

  return (
    <div className="game-header" style={{ width: boardWidth }}>
      <div className="game-header__inner">
        <MineCounter />
        <SmileyButton />
        <Timer />
      </div>
    </div>
  )
}
