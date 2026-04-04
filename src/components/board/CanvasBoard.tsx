import { useCanvasBoardLogic } from './useCanvasBoardLogic';

import { BOARD_BORDER_RADIUS } from '@/constants/ui.constants';

export const CanvasBoard = () => {
  const {
    canvasRef,
    boardWidth,
    boardHeight,
    pinchHandlers,
    boardEntering,
    handleKeyDown,
    handleBoardFocus,
    handleBoardBlur,
    canvasHandlers,
  } = useCanvasBoardLogic();

  return (
    <div
      id="game-board"
      role="grid"
      className={`game-window overflow-hidden${boardEntering ? 'board--entering' : ''}`}
      data-testid="board"
      style={{
        width: boardWidth,
        height: boardHeight,
        touchAction: 'none',
        borderRadius: BOARD_BORDER_RADIUS,
      }}
      tabIndex={0}
      aria-label="Minesweeper board"
      onKeyDown={handleKeyDown}
      onFocus={handleBoardFocus}
      onBlur={handleBoardBlur}
      {...pinchHandlers}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none' }}
        {...canvasHandlers}
      />
    </div>
  );
};
