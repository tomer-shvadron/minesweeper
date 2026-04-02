import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useGameLayout } from '@/hooks/useGameLayout';
import { useHaptic } from '@/hooks/useHaptic';
import { useLongPress } from '@/hooks/useLongPress';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { useSound } from '@/hooks/useSound';
import { drawBoard, hitTestCell } from '@/services/canvas.service';
import { useGameStore } from '@/stores/game.store';
import { selectAllowQuestionMarks, selectIsGameOver } from '@/stores/selectors';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';
import { cellKey } from '@/utils/cell.utils';

const EMPTY_MAP = new Map<string, number>();

export const useCanvasBoardLogic = () => {
  const board = useGameStore((s) => s.board);
  const gameKey = useGameStore((s) => s.gameKey);
  const mineRevealOrder = useGameStore((s) => s.mineRevealOrder);
  const lastChordReveal = useGameStore((s) => s.lastChordReveal);
  const clearChordReveal = useGameStore((s) => s.clearChordReveal);
  const revealCell = useGameStore((s) => s.revealCell);
  const flagCell = useGameStore((s) => s.flagCell);
  const chordClick = useGameStore((s) => s.chordClick);
  const setCellPressStart = useGameStore((s) => s.setCellPressStart);
  const setCellPressEnd = useGameStore((s) => s.setCellPressEnd);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const keyboardBindings = useSettingsStore((s) => s.keyboardBindings);
  const noGuessMode = useSettingsStore((s) => s.noGuessMode);
  const focusedCell = useUIStore((s) => s.focusedCell);
  const setFocusedCell = useUIStore((s) => s.setFocusedCell);
  const openNewGameModal = useUIStore((s) => s.openNewGameModal);
  const play = useSound();
  const vibrate = useHaptic();
  const isGameOver = useGameStore(selectIsGameOver);
  const allowQuestionMarks = useSettingsStore(selectAllowQuestionMarks);

  const { cellSize, boardWidth, boardHeight, config } = useGameLayout();
  const {
    scale,
    panX,
    panY,
    handlers: pinchHandlers,
    resetZoom,
  } = usePinchZoom(1, 5, boardWidth, boardHeight);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [boardEntering, setBoardEntering] = useState(false);
  const [boardFocused, setBoardFocused] = useState(false);
  const boardEnterStart = useRef<number>(0);

  // DPR setup and canvas sizing
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = `${boardWidth}px`;
    canvas.style.height = `${boardHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [boardWidth, boardHeight]);

  // Board entering animation
  useLayoutEffect(() => {
    if (!animationsEnabled) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoardEntering(true);
    boardEnterStart.current = performance.now();
    const duration = (config.rows + config.cols - 2) * 8 + 300;
    const timer = setTimeout(() => setBoardEntering(false), duration);
    return () => clearTimeout(timer);
  }, [gameKey, animationsEnabled, config.rows, config.cols]);

  // Chord reveal cleanup timer
  useEffect(() => {
    if (!lastChordReveal) {
      return;
    }
    const [or, oc] = lastChordReveal.origin;
    const maxDist = lastChordReveal.cells.reduce(
      (max, [r, c]) => Math.max(max, Math.max(Math.abs(r - or), Math.abs(c - oc))),
      0
    );
    const timer = setTimeout(clearChordReveal, maxDist * 30 + 400);
    return () => clearTimeout(timer);
  }, [lastChordReveal, clearChordReveal]);

  // Reset zoom on board size change
  useEffect(() => {
    resetZoom();
  }, [boardWidth, boardHeight, resetZoom]);

  useEffect(() => {
    if (isGameOver) {
      resetZoom();
    }
  }, [isGameOver, resetZoom]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleOrientationChange = () => {
      timer = setTimeout(resetZoom, 150);
    };
    const orientationObj = window.screen?.orientation;
    if (orientationObj) {
      orientationObj.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    return () => {
      clearTimeout(timer);
      if (orientationObj) {
        orientationObj.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, [resetZoom]);

  useEffect(() => {
    setFocusedCell(null);
  }, [gameKey, setFocusedCell]);

  // Lookup maps for animations
  const mineRevealLookup = useMemo(
    () => new Map(mineRevealOrder.map(([r, c], i) => [cellKey(r, c), i])),
    [mineRevealOrder]
  );

  const chordRippleLookup = useMemo(() => {
    if (!lastChordReveal) {
      return EMPTY_MAP;
    }
    const [or, oc] = lastChordReveal.origin;
    return new Map(
      lastChordReveal.cells.map(([r, c]) => [
        cellKey(r, c),
        Math.max(Math.abs(r - or), Math.abs(c - oc)) * 30,
      ])
    );
  }, [lastChordReveal]);

  // RAF draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let rafId: number;
    const render = () => {
      drawBoard(canvas, ctx, {
        board,
        cellSize,
        scale,
        panX,
        panY,
        focusedCell: boardFocused ? focusedCell : null,
        mineRevealLookup: animationsEnabled ? mineRevealLookup : new Map(),
        chordRippleLookup: animationsEnabled ? chordRippleLookup : new Map(),
        animationsEnabled,
        animTime: performance.now(),
      });
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [
    board,
    cellSize,
    scale,
    panX,
    panY,
    focusedCell,
    boardFocused,
    mineRevealLookup,
    chordRippleLookup,
    animationsEnabled,
  ]);

  // Hit testing helper
  const getCell = useCallback(
    (canvasX: number, canvasY: number): [number, number] | null => {
      return hitTestCell(
        canvasX,
        canvasY,
        cellSize,
        config.cols,
        config.rows,
        boardWidth,
        boardHeight,
        scale,
        panX,
        panY
      );
    },
    [cellSize, config.cols, config.rows, boardWidth, boardHeight, scale, panX, panY]
  );

  // Coordinate storage for long-press (captures position before callbacks fire)
  const tapCoords = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTap = useCallback(() => {
    const cell = getCell(tapCoords.current.x, tapCoords.current.y);
    if (!cell) {
      return;
    }
    const [r, c] = cell;
    const boardCell = board[r]?.[c];
    if (!boardCell) {
      return;
    }
    if (isGameOver) {
      return;
    }

    if (boardCell.isRevealed) {
      vibrate('chord');
      chordClick(r, c);
      const chordCells = useGameStore.getState().lastChordReveal?.cells.length ?? 1;
      play('reveal', { mineCount: boardCell.value, cascadeSize: chordCells });
    } else {
      vibrate('reveal');
      revealCell(r, c, { noGuessMode });
      const cascadeSize = useGameStore.getState().lastRevealCount;
      play('reveal', { mineCount: boardCell.value, cascadeSize });
    }
  }, [getCell, board, isGameOver, noGuessMode, chordClick, revealCell, play, vibrate]);

  const handleLongPress = useCallback(() => {
    const cell = getCell(tapCoords.current.x, tapCoords.current.y);
    if (!cell) {
      return;
    }
    const [r, c] = cell;
    const boardCell = board[r]?.[c];
    if (!boardCell || isGameOver || boardCell.isRevealed) {
      return;
    }

    vibrate(boardCell.isFlagged ? 'unflag' : 'flag');
    flagCell(r, c, allowQuestionMarks);
    play('flag');
  }, [getCell, board, isGameOver, flagCell, allowQuestionMarks, play, vibrate]);

  const longPressHandlers = useLongPress({
    onTap: handleTap,
    onLongPress: handleLongPress,
  });

  const getCanvasCoords = useCallback(
    (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { x: 0, y: 0 };
      }
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e) {
        const touch = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
        if (!touch) {
          return { x: 0, y: 0 };
        }
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    },
    []
  );

  const handleBoardFocus = useCallback(() => setBoardFocused(true), []);
  const handleBoardBlur = useCallback(() => setBoardFocused(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      const key = e.key;
      const bindings = keyboardBindings;

      if (key === bindings.newGame) {
        e.preventDefault();
        openNewGameModal();
        return;
      }

      const current = focusedCell ?? [0, 0];
      if (!focusedCell) {
        setFocusedCell(current);
      }
      const [r, c] = current;

      if (key === bindings.moveUp) {
        e.preventDefault();
        setFocusedCell([r === 0 ? config.rows - 1 : r - 1, c]);
        return;
      }
      if (key === bindings.moveDown) {
        e.preventDefault();
        setFocusedCell([r === config.rows - 1 ? 0 : r + 1, c]);
        return;
      }
      if (key === bindings.moveLeft) {
        e.preventDefault();
        setFocusedCell([r, c === 0 ? config.cols - 1 : c - 1]);
        return;
      }
      if (key === bindings.moveRight) {
        e.preventDefault();
        setFocusedCell([r, c === config.cols - 1 ? 0 : c + 1]);
        return;
      }
      if (key === bindings.reveal) {
        e.preventDefault();
        const cell = board[r]?.[c];
        if (cell && !cell.isRevealed) {
          revealCell(r, c, { noGuessMode });
        }
        return;
      }
      if (key === bindings.flag) {
        e.preventDefault();
        const cell = board[r]?.[c];
        if (cell && !cell.isRevealed) {
          flagCell(r, c, allowQuestionMarks);
        }
        return;
      }
      if (key === bindings.chord) {
        e.preventDefault();
        chordClick(r, c);
        return;
      }
    },
    [
      keyboardBindings,
      focusedCell,
      config.rows,
      config.cols,
      board,
      revealCell,
      flagCell,
      chordClick,
      allowQuestionMarks,
      noGuessMode,
      setFocusedCell,
      openNewGameModal,
    ]
  );

  const canvasHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      tapCoords.current = getCanvasCoords(e);
      setCellPressStart();
      longPressHandlers.onTouchStart(e);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      setCellPressEnd();
      longPressHandlers.onTouchEnd(e);
    },
    onTouchMove: longPressHandlers.onTouchMove,
    onClick: (e: React.MouseEvent) => {
      tapCoords.current = getCanvasCoords(e);
      longPressHandlers.onClick(e);
    },
    onContextMenu: (e: React.MouseEvent) => {
      tapCoords.current = getCanvasCoords(e);
      longPressHandlers.onContextMenu(e);
    },
    onMouseDown: () => {
      setCellPressStart();
    },
    onMouseUp: () => {
      setCellPressEnd();
    },
    onMouseLeave: () => {
      setCellPressEnd();
    },
  };

  return {
    canvasRef,
    board,
    config,
    boardWidth,
    boardHeight,
    pinchHandlers,
    boardEntering: animationsEnabled && boardEntering,
    focusedCell: boardFocused ? focusedCell : null,
    handleKeyDown,
    handleBoardFocus,
    handleBoardBlur,
    canvasHandlers,
  };
};
