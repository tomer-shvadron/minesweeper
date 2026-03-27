import { useCanvasBoardLogic } from './useCanvasBoardLogic';

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
      <canvas
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none' }}
        {...canvasHandlers}
      />
    </div>
  );
};
