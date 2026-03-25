import { Cell } from './Cell'
import { useGameBoardLogic } from './useGameBoardLogic'

export const GameBoard = () => {
  const { board, config, cellSize, scale, pinchHandlers } = useGameBoardLogic()

  const boardWidth = cellSize * config.cols
  const boardHeight = cellSize * config.rows

  return (
    /*
     * Outer wrapper: clips overflow and receives pinch events.
     * touch-action: none so the browser doesn't interfere with our gesture handlers.
     */
    <div
      className="overflow-hidden"
      style={{ width: boardWidth, height: boardHeight, touchAction: 'none' }}
      {...pinchHandlers}
    >
      {/*
       * Inner grid: receives the scale transform.
       * transform-origin center so zoom is centred on the board.
       */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: boardWidth,
          height: boardHeight,
        }}
      >
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              row={rowIdx}
              col={colIdx}
              cell={cell}
              cellSize={cellSize}
            />
          ))
        )}
      </div>
    </div>
  )
}
