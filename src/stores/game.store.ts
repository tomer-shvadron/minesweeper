import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DIFFICULTY_PRESETS,
  MAX_COLS,
  MAX_ROWS,
  MIN_COLS,
  MIN_MINES,
  MIN_ROWS,
  SAFE_ZONE_SIZE,
} from '@/constants/game.constants';
import {
  calculateAdjacentValues,
  chordReveal,
  countNewlyRevealed,
  countRemainingFlags,
  countUnrevealedSafe,
  createEmptyBoard,
  isBoardSolvable,
  placeMines,
  revealCell as revealCellFn,
  toggleFlag,
} from '@/services/board.service';
import { useSettingsStore } from '@/stores/settings.store';
import type { Board, BoardConfig, GameStatus } from '@/types/game.types';

interface GameState {
  board: Board;
  status: GameStatus;
  config: BoardConfig;
  elapsedSeconds: number;
  minesRemaining: number;
  isFirstClick: boolean;
  isPressingCell: boolean;
  gameKey: number;
  mineRevealOrder: [number, number][];
  lastChordReveal: { origin: [number, number]; cells: [number, number][] } | null;
  lastRevealCount: number;
  unrevealedSafeCount: number;
  firstClick: [number, number] | null;
  totalClicks: number;
}

interface GameActions {
  startNewGame: (config?: BoardConfig) => void;
  revealCell: (row: number, col: number) => void;
  flagCell: (row: number, col: number, allowQuestionMarks: boolean) => void;
  chordClick: (row: number, col: number) => void;
  tick: () => void;
  setCellPressStart: () => void;
  setCellPressEnd: () => void;
  clearChordReveal: () => void;
  _applyGeneratedBoard: (board: Board) => void;
}

type GameStore = GameState & GameActions;

const DEFAULT_CONFIG = DIFFICULTY_PRESETS.beginner;

const VALID_GAME_STATUSES = new Set<GameStatus>(['idle', 'playing', 'won', 'lost', 'generating']);

/** Validate persisted game state, returning null if corrupted. */
function isValidPersistedState(persisted: unknown): boolean {
  if (!persisted || typeof persisted !== 'object') {
    return false;
  }
  const s = persisted as Record<string, unknown>;

  // Validate status
  if (typeof s.status !== 'string' || !VALID_GAME_STATUSES.has(s.status as GameStatus)) {
    return false;
  }

  // Validate config
  const config = s.config as BoardConfig | undefined;
  if (
    !config ||
    typeof config.rows !== 'number' ||
    typeof config.cols !== 'number' ||
    typeof config.mines !== 'number'
  ) {
    return false;
  }
  if (
    !Number.isFinite(config.rows) ||
    !Number.isFinite(config.cols) ||
    !Number.isFinite(config.mines)
  ) {
    return false;
  }

  // Validate board dimensions match config
  if (!Array.isArray(s.board)) {
    return false;
  }
  const board = s.board as unknown[][];
  if (board.length !== config.rows) {
    return false;
  }
  const firstRow = board[0];
  if (!Array.isArray(firstRow) || firstRow.length !== config.cols) {
    return false;
  }

  // Validate elapsedSeconds
  if (typeof s.elapsedSeconds !== 'number' || s.elapsedSeconds < 0) {
    return false;
  }

  return true;
}

/** Clamp a board config to valid bounds, protecting against UI bugs and corrupted localStorage. */
function validateConfig(config: BoardConfig): BoardConfig {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const rows = clamp(Math.floor(config.rows), MIN_ROWS, MAX_ROWS);
  const cols = clamp(Math.floor(config.cols), MIN_COLS, MAX_COLS);
  const maxMines = rows * cols - SAFE_ZONE_SIZE;
  const mines = clamp(Math.floor(config.mines), MIN_MINES, maxMines);
  return { rows, cols, mines };
}

let workerRef: Worker | null = null;
let pendingRevealRow = 0;
let pendingRevealCol = 0;

/**
 * Shared post-reveal logic: determines game status, builds mine reveal order,
 * and counts newly revealed cells. Used by both `revealCell` and `_applyGeneratedBoard`.
 */
function resolveRevealResult(
  oldBoard: Board,
  newBoard: Board,
  config: BoardConfig,
  row: number,
  col: number,
  prevUnrevealedSafe: number
) {
  // O(1) loss check: the board service marks the detonated cell with isExploded
  const isLoss = newBoard[row]?.[col]?.isExploded === true;

  // Count newly revealed safe cells for incremental win tracking
  const newlyRevealed = countNewlyRevealed(oldBoard, newBoard);
  const newUnrevealedSafe = prevUnrevealedSafe - newlyRevealed;

  let newStatus: GameStatus = 'playing';
  if (isLoss) {
    newStatus = 'lost';
  } else if (newUnrevealedSafe <= 0) {
    newStatus = 'won';
  }

  let mineRevealOrder: [number, number][] = [];
  if (newStatus === 'lost') {
    const mines: [number, number][] = [];
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (newBoard[r]?.[c]?.hasMine && !newBoard[r]?.[c]?.isExploded) {
          mines.push([r, c]);
        }
      }
    }
    mineRevealOrder = mines.sort(
      (a, b) =>
        Math.max(Math.abs(a[0] - row), Math.abs(a[1] - col)) -
        Math.max(Math.abs(b[0] - row), Math.abs(b[1] - col))
    );
  }

  return {
    newStatus,
    mineRevealOrder,
    lastRevealCount: newlyRevealed,
    unrevealedSafeCount: newUnrevealedSafe,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      board: createEmptyBoard(DEFAULT_CONFIG),
      status: 'idle',
      config: DEFAULT_CONFIG,
      elapsedSeconds: 0,
      minesRemaining: DEFAULT_CONFIG.mines,
      isFirstClick: true,
      isPressingCell: false,
      gameKey: 0,
      mineRevealOrder: [],
      lastChordReveal: null,
      lastRevealCount: 0,
      unrevealedSafeCount: DEFAULT_CONFIG.rows * DEFAULT_CONFIG.cols - DEFAULT_CONFIG.mines,
      firstClick: null,
      totalClicks: 0,

      startNewGame: (config) => {
        workerRef?.terminate();
        workerRef = null;
        const newConfig = validateConfig(config ?? get().config);
        set({
          board: createEmptyBoard(newConfig),
          status: 'idle',
          config: newConfig,
          elapsedSeconds: 0,
          minesRemaining: newConfig.mines,
          isFirstClick: true,
          isPressingCell: false,
          gameKey: get().gameKey + 1,
          mineRevealOrder: [],
          lastChordReveal: null,
          unrevealedSafeCount: newConfig.rows * newConfig.cols - newConfig.mines,
          firstClick: null,
          totalClicks: 0,
        });
      },

      revealCell: (row, col) => {
        const {
          board,
          config,
          isFirstClick,
          status,
          firstClick,
          totalClicks,
          unrevealedSafeCount,
        } = get();
        if (status === 'won' || status === 'lost' || status === 'generating') {
          return;
        }

        let currentBoard = board;

        if (isFirstClick) {
          const { noGuessMode } = useSettingsStore.getState();

          if (typeof Worker !== 'undefined') {
            pendingRevealRow = row;
            pendingRevealCol = col;
            workerRef?.terminate();
            workerRef = new Worker(new URL('../workers/board.worker.ts', import.meta.url), {
              type: 'module',
            });
            workerRef.onmessage = (e: MessageEvent<{ board: Board; minesRemaining: number }>) => {
              workerRef = null;
              get()._applyGeneratedBoard(e.data.board);
            };
            workerRef.onerror = () => {
              workerRef = null;
              const { board: b, config: cfg } = get();
              const r = pendingRevealRow;
              const c = pendingRevealCol;
              const mb = placeMines(b, cfg, r, c);
              const vb = calculateAdjacentValues(mb);
              get()._applyGeneratedBoard(vb);
            };
            set({ status: 'generating' });
            workerRef.postMessage({
              board: currentBoard,
              config,
              firstClickRow: row,
              firstClickCol: col,
              noGuess: noGuessMode,
            });
            return;
          }

          // Synchronous fallback (test environments / no Worker support)
          if (noGuessMode) {
            const MAX_ATTEMPTS = 100;
            let found = false;
            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
              const mineBoard = placeMines(currentBoard, config, row, col);
              const valuedBoard = calculateAdjacentValues(mineBoard);
              if (isBoardSolvable(valuedBoard, [row, col])) {
                currentBoard = valuedBoard;
                found = true;
                break;
              }
            }
            if (!found) {
              const mineBoard = placeMines(currentBoard, config, row, col);
              currentBoard = calculateAdjacentValues(mineBoard);
            }
          } else {
            const boardWithMines = placeMines(currentBoard, config, row, col);
            currentBoard = calculateAdjacentValues(boardWithMines);
          }
        }

        const newBoard = revealCellFn(currentBoard, row, col);

        // On first click, compute the initial unrevealed safe count from the generated board
        const prevUnrevealedSafe = isFirstClick
          ? countUnrevealedSafe(currentBoard)
          : unrevealedSafeCount;

        const result = resolveRevealResult(
          currentBoard,
          newBoard,
          config,
          row,
          col,
          prevUnrevealedSafe
        );

        set({
          board: newBoard,
          status: result.newStatus,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
          isFirstClick: false,
          mineRevealOrder: result.mineRevealOrder,
          lastRevealCount: result.lastRevealCount,
          unrevealedSafeCount: result.unrevealedSafeCount,
          firstClick: firstClick ?? [row, col],
          totalClicks: totalClicks + 1,
        });
      },

      _applyGeneratedBoard: (generatedBoard) => {
        const { config, firstClick, totalClicks } = get();
        const row = pendingRevealRow;
        const col = pendingRevealCol;

        const newBoard = revealCellFn(generatedBoard, row, col);
        const prevUnrevealedSafe = countUnrevealedSafe(generatedBoard);
        const result = resolveRevealResult(
          generatedBoard,
          newBoard,
          config,
          row,
          col,
          prevUnrevealedSafe
        );

        set({
          board: newBoard,
          status: result.newStatus,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
          isFirstClick: false,
          mineRevealOrder: result.mineRevealOrder,
          lastRevealCount: result.lastRevealCount,
          unrevealedSafeCount: result.unrevealedSafeCount,
          firstClick: firstClick ?? [row, col],
          totalClicks: totalClicks + 1,
        });
      },

      flagCell: (row, col, allowQuestionMarks) => {
        const { board, config, status } = get();
        if (status === 'won' || status === 'lost') {
          return;
        }
        const newBoard = toggleFlag(board, row, col, allowQuestionMarks);
        set({
          board: newBoard,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
        });
      },

      chordClick: (row, col) => {
        const { board, config, status, totalClicks, unrevealedSafeCount } = get();
        if (status !== 'playing') {
          return;
        }
        const newBoard = chordReveal(board, row, col);

        // O(1) loss check: check if any newly revealed cell is exploded
        // chordReveal can trigger mines on neighbors, so check all neighbors
        let isLoss = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr;
            const nc = col + dc;
            if (newBoard[nr]?.[nc]?.isExploded) {
              isLoss = true;
            }
          }
        }

        const newlyRevealed = countNewlyRevealed(board, newBoard);
        const newUnrevealedSafe = unrevealedSafeCount - newlyRevealed;

        let newStatus: GameStatus = 'playing';
        if (isLoss) {
          newStatus = 'lost';
        } else if (newUnrevealedSafe <= 0) {
          newStatus = 'won';
        }

        let lastChordReveal: GameState['lastChordReveal'] = null;
        if (newStatus !== 'lost') {
          const cells: [number, number][] = [];
          for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
              if (!board[r]?.[c]?.isRevealed && newBoard[r]?.[c]?.isRevealed) {
                cells.push([r, c]);
              }
            }
          }
          if (cells.length > 0) {
            lastChordReveal = { origin: [row, col], cells };
          }
        }

        set({
          board: newBoard,
          status: newStatus,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
          lastChordReveal,
          unrevealedSafeCount: newUnrevealedSafe,
          totalClicks: totalClicks + 1,
        });
      },

      tick: () => {
        if (get().status === 'playing') {
          set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
        }
      },

      setCellPressStart: () => set({ isPressingCell: true }),
      setCellPressEnd: () => set({ isPressingCell: false }),
      clearChordReveal: () => set({ lastChordReveal: null }),
    }),
    {
      name: 'minesweeper-game',
      partialize: (s) => ({
        board: s.board,
        status: s.status === 'generating' ? 'idle' : s.status,
        config: s.config,
        elapsedSeconds: s.elapsedSeconds,
        minesRemaining: s.minesRemaining,
        isFirstClick: s.isFirstClick,
        unrevealedSafeCount: s.unrevealedSafeCount,
      }),
      merge: (persisted, current) => {
        if (!isValidPersistedState(persisted)) {
          return current;
        }
        return { ...current, ...(persisted as object) };
      },
    }
  )
);
