import { Cell } from './Cell'
import { useGameBoardLogic } from './useGameBoardLogic'

export const GameBoard = () => {
  const { board, config, cellSize, boardWidth, boardHeight, scale, pinchHandlers } =
    useGameBoardLogic()

  return (
    <div
      className="overflow-hidden"
      style={{ width: boardWidth, height: boardHeight, touchAction: 'none' }}
      {...pinchHandlers}
    >
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
