import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { DIFFICULTY_PRESETS } from '@/constants/game.constants'
import {
  calculateAdjacentValues,
  checkLoss,
  checkWin,
  chordReveal,
  countRemainingFlags,
  createEmptyBoard,
  placeMines,
  revealCell as revealCellFn,
  toggleFlag,
} from '@/services/board.service'
import type { Board, BoardConfig, GameStatus } from '@/types/game.types'

interface GameState {
  board: Board
  status: GameStatus
  config: BoardConfig
  elapsedSeconds: number
  minesRemaining: number
  isFirstClick: boolean
  isPressingCell: boolean
  gameKey: number
  mineRevealOrder: [number, number][]
  lastChordReveal: { origin: [number, number]; cells: [number, number][] } | null
  lastRevealCount: number
  firstClick: [number, number] | null
  totalClicks: number
}

interface GameActions {
  startNewGame: (config?: BoardConfig) => void
  revealCell: (row: number, col: number) => void
  flagCell: (row: number, col: number, allowQuestionMarks: boolean) => void
  chordClick: (row: number, col: number) => void
  tick: () => void
  setCellPressStart: () => void
  setCellPressEnd: () => void
  clearChordReveal: () => void
}

type GameStore = GameState & GameActions

const DEFAULT_CONFIG = DIFFICULTY_PRESETS.beginner

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
      firstClick: null,
      totalClicks: 0,

      startNewGame: (config) => {
        const newConfig = config ?? get().config
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
          firstClick: null,
          totalClicks: 0,
        })
      },

      revealCell: (row, col) => {
        const { board, config, isFirstClick, status, firstClick, totalClicks } = get()
        if (status === 'won' || status === 'lost') {
          return
        }

        let currentBoard = board

        if (isFirstClick) {
          const boardWithMines = placeMines(currentBoard, config, row, col)
          currentBoard = calculateAdjacentValues(boardWithMines)
        }

        const newBoard = revealCellFn(currentBoard, row, col)

        let newStatus: GameStatus = 'playing'
        if (checkLoss(newBoard)) {
          newStatus = 'lost'
        } else if (checkWin(newBoard)) {
          newStatus = 'won'
        }

        let mineRevealOrder: [number, number][] = []
        if (newStatus === 'lost') {
          const mines: [number, number][] = []
          for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
              if (newBoard[r]?.[c]?.hasMine && !newBoard[r]?.[c]?.isExploded) {
                mines.push([r, c])
              }
            }
          }
          mineRevealOrder = mines.sort(
            (a, b) =>
              Math.max(Math.abs(a[0] - row), Math.abs(a[1] - col)) -
              Math.max(Math.abs(b[0] - row), Math.abs(b[1] - col))
          )
        }

        let lastRevealCount = 0
        for (let r = 0; r < config.rows; r++) {
          for (let c = 0; c < config.cols; c++) {
            if (!currentBoard[r]?.[c]?.isRevealed && newBoard[r]?.[c]?.isRevealed) {
              lastRevealCount++
            }
          }
        }

        set({
          board: newBoard,
          status: newStatus,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
          isFirstClick: false,
          mineRevealOrder,
          lastRevealCount,
          firstClick: firstClick ?? [row, col],
          totalClicks: totalClicks + 1,
        })
      },

      flagCell: (row, col, allowQuestionMarks) => {
        const { board, config, status } = get()
        if (status === 'won' || status === 'lost') {
          return
        }
        const newBoard = toggleFlag(board, row, col, allowQuestionMarks)
        set({
          board: newBoard,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
        })
      },

      chordClick: (row, col) => {
        const { board, config, status, totalClicks } = get()
        if (status !== 'playing') {
          return
        }
        const newBoard = chordReveal(board, row, col)

        let newStatus: GameStatus = 'playing'
        if (checkLoss(newBoard)) {
          newStatus = 'lost'
        } else if (checkWin(newBoard)) {
          newStatus = 'won'
        }

        let lastChordReveal: GameState['lastChordReveal'] = null
        if (newStatus !== 'lost') {
          const cells: [number, number][] = []
          for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
              if (!board[r]?.[c]?.isRevealed && newBoard[r]?.[c]?.isRevealed) {
                cells.push([r, c])
              }
            }
          }
          if (cells.length > 0) {
            lastChordReveal = { origin: [row, col], cells }
          }
        }

        set({
          board: newBoard,
          status: newStatus,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
          lastChordReveal,
          totalClicks: totalClicks + 1,
        })
      },

      tick: () => {
        if (get().status === 'playing') {
          set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }))
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
        status: s.status,
        config: s.config,
        elapsedSeconds: s.elapsedSeconds,
        minesRemaining: s.minesRemaining,
        isFirstClick: s.isFirstClick,
      }),
    }
  )
)
