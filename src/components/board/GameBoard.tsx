import { Cell } from './Cell'
import { useGameBoardLogic } from './useGameBoardLogic'

export const GameBoard = () => {
  const {
    board,
    config,
    cellSize,
    boardWidth,
    boardHeight,
    scale,
    panX,
    panY,
    pinchHandlers,
    boardEntering,
    mineRevealLookup,
    chordRippleLookup,
    focusedCell,
    handleKeyDown,
    handleBoardFocus,
    handleBoardBlur,
  } = useGameBoardLogic()

  return (
    <div
      role="grid"
      className={boardEntering ? 'board--entering overflow-hidden' : 'overflow-hidden'}
      data-testid="board"
      style={{ width: boardWidth, height: boardHeight, touchAction: 'none' }}
      tabIndex={0}
      aria-label="Minesweeper board"
      onKeyDown={handleKeyDown}
      onFocus={handleBoardFocus}
      onBlur={handleBoardBlur}
      {...pinchHandlers}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: 'center center',
          width: boardWidth,
          height: boardHeight,
        }}
      >
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const key = `${rowIdx},${colIdx}`
            const mineRevealIndex = mineRevealLookup.get(key)
            const chordRippleDelay = chordRippleLookup.get(key)
            const isFocused =
              focusedCell !== null && focusedCell[0] === rowIdx && focusedCell[1] === colIdx
            return (
              <Cell
                key={`${rowIdx}-${colIdx}`}
                row={rowIdx}
                col={colIdx}
                cell={cell}
                cellSize={cellSize}
                isFocused={isFocused}
                {...(mineRevealIndex !== undefined && { mineRevealIndex })}
                {...(chordRippleDelay !== undefined && { chordRippleDelay })}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
