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
}

interface GameActions {
  startNewGame: (config?: BoardConfig) => void
  revealCell: (row: number, col: number) => void
  flagCell: (row: number, col: number, allowQuestionMarks: boolean) => void
  chordClick: (row: number, col: number) => void
  tick: () => void
  setCellPressStart: () => void
  setCellPressEnd: () => void
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
        })
      },

      revealCell: (row, col) => {
        const { board, config, isFirstClick, status } = get()
        if (status === 'won' || status === 'lost') return

        let currentBoard = board

        if (isFirstClick) {
          const boardWithMines = placeMines(currentBoard, config, row, col)
          currentBoard = calculateAdjacentValues(boardWithMines)
        }

        const newBoard = revealCellFn(currentBoard, row, col)

        let newStatus: GameStatus = 'playing'
        if (checkLoss(newBoard)) newStatus = 'lost'
        else if (checkWin(newBoard)) newStatus = 'won'

        set({
          board: newBoard,
          status: newStatus,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
          isFirstClick: false,
        })
      },

      flagCell: (row, col, allowQuestionMarks) => {
        const { board, config, status } = get()
        if (status === 'won' || status === 'lost') return
        const newBoard = toggleFlag(board, row, col, allowQuestionMarks)
        set({
          board: newBoard,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
        })
      },

      chordClick: (row, col) => {
        const { board, config, status } = get()
        if (status !== 'playing') return
        const newBoard = chordReveal(board, row, col)

        let newStatus: GameStatus = 'playing'
        if (checkLoss(newBoard)) newStatus = 'lost'
        else if (checkWin(newBoard)) newStatus = 'won'

        set({
          board: newBoard,
          status: newStatus,
          minesRemaining: countRemainingFlags(newBoard, config.mines),
        })
      },

      tick: () => {
        if (get().status === 'playing') {
          set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }))
        }
      },

      setCellPressStart: () => set({ isPressingCell: true }),
      setCellPressEnd: () => set({ isPressingCell: false }),
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
