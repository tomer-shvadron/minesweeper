import { CanvasBoard } from './CanvasBoard';
import { Cell } from './Cell';
import { FloatingPills } from './FloatingPills';
import { useGameBoardLogic } from './useGameBoardLogic';

import { CANVAS_THRESHOLD } from '@/constants/game.constants';
import { useGameLayout } from '@/hooks/useGameLayout';
import { useGameStore } from '@/stores/game.store';
import { useSettingsStore } from '@/stores/settings.store';
import { CELL_GAP_ROUNDED } from '@/utils/layout.utils';

const DOMBoard = () => {
  const {
    board,
    config,
    cellSize,
    scale,
    panX,
    panY,
    gridInteractionHandlers,
    boardEntering,
    mineRevealLookup,
    chordRippleLookup,
    floodRippleLookup,
    focusedCell,
    handleKeyDown,
    handleBoardFocus,
    handleBoardBlur,
  } = useGameBoardLogic();

  const cellStyleSetting = useSettingsStore((s) => s.cellStyle);
  const { showFloatingPills } = useGameLayout();
  const isRounded = cellStyleSetting === 'rounded';
  const gap = isRounded ? CELL_GAP_ROUNDED : 0;
  const totalW = cellSize * config.cols + gap * (config.cols - 1);
  const totalH = cellSize * config.rows + gap * (config.rows - 1);

  return (
    <div className="flex flex-col">
      {showFloatingPills && <FloatingPills />}
      <div
        id="game-board"
        role="grid"
        className={`game-window overflow-hidden${boardEntering ? 'board--entering' : ''}`}
        data-testid="board"
        style={{ width: totalW, height: totalH, touchAction: 'none' }}
        tabIndex={0}
        aria-label="Minesweeper board"
        onKeyDown={handleKeyDown}
        onFocus={handleBoardFocus}
        onBlur={handleBoardBlur}
        {...gridInteractionHandlers}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
            gap: `${gap}px`,
            transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            transformOrigin: 'center center',
            width: totalW,
            height: totalH,
          }}
        >
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const key = `${rowIdx},${colIdx}`;
              const mineRevealIndex = mineRevealLookup.get(key);
              const chordRippleDelay = chordRippleLookup.get(key);
              const floodRippleDelay = floodRippleLookup.get(key);
              const isFocused =
                focusedCell !== null && focusedCell[0] === rowIdx && focusedCell[1] === colIdx;
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
                  {...(floodRippleDelay !== undefined && { floodRippleDelay })}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const CanvasBoardWrapper = () => {
  const { showFloatingPills } = useGameLayout();
  return (
    <div className="flex flex-col">
      {showFloatingPills && <FloatingPills />}
      <CanvasBoard />
    </div>
  );
};

export const GameBoard = () => {
  const config = useGameStore((s) => s.config);
  const useCanvas = config.rows * config.cols > CANVAS_THRESHOLD;
  return useCanvas ? <CanvasBoardWrapper /> : <DOMBoard />;
};
