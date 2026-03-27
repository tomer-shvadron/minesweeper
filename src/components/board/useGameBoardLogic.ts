import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';

import { useGameLayout } from '@/hooks/useGameLayout';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { useGameStore } from '@/stores/game.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';

export const useGameBoardLogic = () => {
  const board = useGameStore((s) => s.board);
  const status = useGameStore((s) => s.status);
  const gameKey = useGameStore((s) => s.gameKey);
  const mineRevealOrder = useGameStore((s) => s.mineRevealOrder);
  const lastChordReveal = useGameStore((s) => s.lastChordReveal);
  const clearChordReveal = useGameStore((s) => s.clearChordReveal);
  const revealCell = useGameStore((s) => s.revealCell);
  const flagCell = useGameStore((s) => s.flagCell);
  const chordClick = useGameStore((s) => s.chordClick);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const flagMode = useSettingsStore((s) => s.flagMode);
  const keyboardBindings = useSettingsStore((s) => s.keyboardBindings);
  const focusedCell = useUIStore((s) => s.focusedCell);
  const setFocusedCell = useUIStore((s) => s.setFocusedCell);
  const openNewGameModal = useUIStore((s) => s.openNewGameModal);
  const { cellSize, boardWidth, boardHeight, config } = useGameLayout();
  const {
    scale,
    panX,
    panY,
    handlers: pinchHandlers,
    resetZoom,
  } = usePinchZoom(1, 5, boardWidth, boardHeight);

  const [boardEntering, setBoardEntering] = useState(false);
  const [boardFocused, setBoardFocused] = useState(false);

  useLayoutEffect(() => {
    if (!animationsEnabled) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoardEntering(true);
    const duration = (config.rows + config.cols - 2) * 8 + 300;
    const timer = setTimeout(() => {
      setBoardEntering(false);
    }, duration);
    return () => {
      clearTimeout(timer);
    };
  }, [gameKey, animationsEnabled, config.rows, config.cols]);

  useEffect(() => {
    if (!lastChordReveal) {
      return;
    }
    const [or, oc] = lastChordReveal.origin;
    const maxDist = lastChordReveal.cells.reduce((max, [r, c]) => {
      return Math.max(max, Math.max(Math.abs(r - or), Math.abs(c - oc)));
    }, 0);
    const timer = setTimeout(clearChordReveal, maxDist * 30 + 400);
    return () => {
      clearTimeout(timer);
    };
  }, [lastChordReveal, clearChordReveal]);

  useEffect(() => {
    resetZoom();
  }, [boardWidth, boardHeight, resetZoom]);

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
    if (status === 'won' || status === 'lost') {
      resetZoom();
    }
  }, [status, resetZoom]);

  // Clear focused cell when game resets
  useEffect(() => {
    setFocusedCell(null);
  }, [gameKey, setFocusedCell]);

  const handleBoardFocus = useCallback((_e: React.FocusEvent<HTMLDivElement>) => {
    setBoardFocused(true);
    // Do NOT auto-place the cursor here. useLongPress calls e.preventDefault()
    // on every touchstart, which suppresses native focus on the cell <button>
    // and redirects it to the board div — making e.target === e.currentTarget
    // true even for touch gestures. Any guard based on that check is therefore
    // unreliable. The keyboard cursor is instead materialised lazily on the
    // first actual key press in handleKeyDown, so touch gestures (taps, zooms)
    // never cause the top-left cell to light up.
  }, []);

  const handleBoardBlur = useCallback(() => {
    setBoardFocused(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const key = e.key;
      const bindings = keyboardBindings;

      // New game shortcut (always active when board focused)
      if (key === bindings.newGame) {
        e.preventDefault();
        openNewGameModal();
        return;
      }

      // Lazily activate the keyboard cursor on the first navigation/action key.
      // This ensures the cursor only appears when the user genuinely starts
      // keyboard navigation — never from touch gestures that incidentally focus
      // the board div.
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
          revealCell(r, c);
        }
        return;
      }
      if (key === bindings.flag) {
        e.preventDefault();
        const cell = board[r]?.[c];
        if (cell && !cell.isRevealed) {
          flagCell(r, c, flagMode === 'flags-and-questions');
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
      flagMode,
      setFocusedCell,
      openNewGameModal,
    ]
  );

  const mineRevealLookup = useMemo(
    () => new Map(mineRevealOrder.map(([r, c], i) => [`${r},${c}`, i])),
    [mineRevealOrder]
  );

  const chordRippleLookup = useMemo(() => {
    if (!lastChordReveal) {
      return new Map<string, number>();
    }
    const [or, oc] = lastChordReveal.origin;
    return new Map(
      lastChordReveal.cells.map(([r, c]) => [
        `${r},${c}`,
        Math.max(Math.abs(r - or), Math.abs(c - oc)) * 30,
      ])
    );
  }, [lastChordReveal]);

  return {
    board,
    config,
    cellSize,
    boardWidth,
    boardHeight,
    scale,
    panX,
    panY,
    pinchHandlers,
    boardEntering: animationsEnabled && boardEntering,
    mineRevealLookup: animationsEnabled ? mineRevealLookup : new Map<string, number>(),
    chordRippleLookup: animationsEnabled ? chordRippleLookup : new Map<string, number>(),
    focusedCell: boardFocused ? focusedCell : null,
    handleKeyDown,
    handleBoardFocus,
    handleBoardBlur,
  };
};
