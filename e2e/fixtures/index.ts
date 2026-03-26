import { test as base, type Page } from '@playwright/test'

import type { CellState, Board, BoardConfig } from '../../src/types/game.types'

interface GameState {
  board: Board
  status: 'idle' | 'playing' | 'won' | 'lost'
  config: BoardConfig
  elapsedSeconds: number
  minesRemaining: number
  isFirstClick: boolean
}

interface LeaderboardEntry {
  name: string
  timeSeconds: number
  date: string
}

interface LeaderboardState {
  entries: Record<string, LeaderboardEntry[]>
  gamesPlayed: Record<string, number>
  lastPlayerName: string
}

interface MinesweeperTestBridge {
  getGameState(): GameState
  setGameState(partial: Partial<GameState>): void
  getLeaderboardState(): LeaderboardState
  setLeaderboardState(partial: Partial<LeaderboardState>): void
  getUIState(): Record<string, unknown>
  setUIState(partial: Record<string, unknown>): void
  revealCell(row: number, col: number): void
  startNewGame(config?: BoardConfig): void
  openNewGameModal(): void
}

declare global {
  interface Window {
    __MINESWEEPER_TEST__: MinesweeperTestBridge
  }
}

// Re-export types for use in spec files
export type { GameState, LeaderboardState, LeaderboardEntry, CellState, Board, BoardConfig }

export interface GamePageFixtures {
  gamePage: GamePage
}

export class GamePage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/')
    await this._dismissResumePrompt()
  }

  private async _dismissResumePrompt() {
    const resumeModal = this.page.getByRole('dialog', { name: 'Resume Game?' })
    if (await resumeModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.getByRole('button', { name: 'New Game' }).click()
    }
  }

  async getGameState(): Promise<GameState> {
    return this.page.evaluate(() => window.__MINESWEEPER_TEST__.getGameState())
  }

  async setGameState(partial: Partial<GameState>): Promise<void> {
    await this.page.evaluate((p) => window.__MINESWEEPER_TEST__.setGameState(p), partial)
  }

  async getLeaderboardState(): Promise<LeaderboardState> {
    return this.page.evaluate(() => window.__MINESWEEPER_TEST__.getLeaderboardState())
  }

  async setLeaderboardState(partial: Partial<LeaderboardState>): Promise<void> {
    await this.page.evaluate((p) => window.__MINESWEEPER_TEST__.setLeaderboardState(p), partial)
  }

  /**
   * Seeds the leaderboard localStorage key with data, then reloads the page so
   * Zustand's persist middleware hydrates with the desired values (e.g. lastPlayerName)
   * before components mount — important for lazy useState initializers.
   *
   * Registers an addInitScript that runs AFTER the fixture's clear script (scripts
   * run in registration order), so the clear happens first and the seed runs second.
   */
  async seedLeaderboardStorage(data: Partial<LeaderboardState>): Promise<void> {
    const payload = {
      state: { entries: {}, gamesPlayed: {}, lastPlayerName: '', ...data },
      version: 0,
    }
    // This init script runs on every subsequent navigation in this test, after the
    // fixture's clear script, so the data survives the reload.
    await this.page.addInitScript((p) => {
      localStorage.setItem('minesweeper-leaderboard', JSON.stringify(p))
    }, payload)
    await this.page.reload()
    await this._dismissResumePrompt()
  }

  async revealCellViaStore(row: number, col: number): Promise<void> {
    await this.page.evaluate(([r, c]) => window.__MINESWEEPER_TEST__.revealCell(r, c), [
      row,
      col,
    ] as [number, number])
  }

  async startNewGame(config?: BoardConfig): Promise<void> {
    await this.page.evaluate(
      (c) => window.__MINESWEEPER_TEST__.startNewGame(c ?? undefined),
      config ?? null
    )
  }

  /** Open NewGameModal and start a game with the given preset */
  async startPreset(preset: 'Beginner' | 'Intermediate' | 'Expert') {
    await this.smiley.click()
    const modal = this.newGameModal()
    await modal.waitFor()
    await this.page.getByLabel(preset).check()
    await this.page.getByRole('button', { name: 'Start' }).click()
    await modal.waitFor({ state: 'hidden' })
  }

  /**
   * Performs the first click (which places mines). Returns the post-first-click board state.
   * The clicked cell is guaranteed mine-free by game rules.
   */
  async firstClick(row = 0, col = 0): Promise<GameState> {
    await this.page.getByRole('button', { name: `Cell ${row},${col}` }).click()
    await this.page.waitForFunction(() => {
      const s = window.__MINESWEEPER_TEST__.getGameState()
      return s.status === 'playing' || s.status === 'won' || s.status === 'lost'
    })
    return this.getGameState()
  }

  /**
   * Returns the first unrevealed, non-mine, non-flagged cell on the board.
   * Throws if no such cell exists. Use this after firstClick to find a safe
   * cell to flag/click without relying on hardcoded coordinates (flood fill
   * might have already revealed corner cells).
   */
  async findUnrevealedSafeCell(): Promise<[number, number]> {
    const state = await this.getGameState()
    for (let r = 0; r < state.config.rows; r++) {
      for (let c = 0; c < state.config.cols; c++) {
        const cell = state.board[r]?.[c]
        if (cell && !cell.isRevealed && !cell.hasMine && !cell.isFlagged) {
          return [r, c]
        }
      }
    }
    throw new Error('No unrevealed safe cell found')
  }

  /**
   * Reveals all currently-unrevealed safe cells via a single page.evaluate call,
   * then waits for status === 'won'. Does NOT perform a first click — call
   * firstClick() before this if the game hasn't been started yet.
   *
   * Using a single evaluate avoids 40+ sequential round-trips and the cascade
   * problem: flood-fill may reveal the "last" cell before we can click it, making
   * the game already 'won' and the GameOverBanner would block a final UI click.
   * revealCell() is a no-op for already-revealed cells and when status === 'won'.
   */
  async winGameFromCurrentState(): Promise<void> {
    await this.page.evaluate(() => {
      const bridge = window.__MINESWEEPER_TEST__
      const { board, config } = bridge.getGameState()
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          const cell = board[r]?.[c]
          if (cell && !cell.hasMine && !cell.isRevealed) {
            bridge.revealCell(r, c)
          }
        }
      }
    })
    await this.page.waitForFunction(
      () => window.__MINESWEEPER_TEST__.getGameState().status === 'won'
    )
  }

  /** Win a game: first-clicks [0,0] to place mines, then reveals all safe cells. */
  async winGame(): Promise<void> {
    await this.firstClick(0, 0)
    await this.winGameFromCurrentState()
  }

  /**
   * Lose a game by clicking an unflagged mine.
   * If the game is already in 'playing' state (mines placed), skips the
   * firstClick to avoid double-clicking an already-revealed cell. Also skips
   * flagged mines so they don't silently absorb the click.
   */
  async loseGame(): Promise<void> {
    const initial = await this.getGameState()
    if (initial.status === 'idle') {
      await this.firstClick(0, 0)
    }
    const state = await this.getGameState()
    const { board, config } = state

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const cell = board[r]?.[c]
        if (cell?.hasMine && !cell.isFlagged) {
          await this.page.getByRole('button', { name: `Cell ${r},${c}` }).click()
          await this.page.waitForFunction(
            () => window.__MINESWEEPER_TEST__.getGameState().status === 'lost'
          )
          return
        }
      }
    }
    throw new Error('No unflagged mine found on board')
  }

  async waitForStatus(status: 'idle' | 'playing' | 'won' | 'lost') {
    await this.page.waitForFunction(
      (s) => window.__MINESWEEPER_TEST__.getGameState().status === s,
      status
    )
  }

  cell(row: number, col: number) {
    return this.page.getByRole('button', { name: `Cell ${row},${col}` })
  }

  get smiley() {
    return this.page.getByRole('button', { name: 'New game' })
  }

  get mineCounter() {
    return this.page.getByTestId('mine-counter')
  }

  get timer() {
    return this.page.getByTestId('timer')
  }

  get gameOverBanner() {
    return this.page.getByTestId('game-over-banner')
  }

  get board() {
    return this.page.getByTestId('board')
  }

  newGameModal() {
    return this.page.getByRole('dialog', { name: 'New Game' })
  }

  settingsModal() {
    return this.page.getByRole('dialog', { name: 'Settings' })
  }

  leaderboardModal() {
    return this.page.getByRole('dialog', { name: 'Best Times' })
  }

  highScorePrompt() {
    return this.page.getByRole('dialog', { name: 'New High Score!' })
  }
}

/**
 * Standard test fixture — clears localStorage via addInitScript so it's wiped
 * on EVERY page navigation (including reloads). Use for all non-persistence tests.
 */
export const test = base.extend<GamePageFixtures>({
  gamePage: async ({ page }, provide) => {
    const gp = new GamePage(page)
    await page.addInitScript(() => localStorage.clear())
    await gp.goto()
    await provide(gp)
  },
})

/**
 * Persistence test fixture — clears localStorage ONCE at test start via
 * page.evaluate, so that in-test page.reload() calls DO NOT wipe the data.
 * Use only in persistence/local-storage.spec.ts.
 */
export const persistenceTest = base.extend<GamePageFixtures>({
  gamePage: async ({ page }, provide) => {
    const gp = new GamePage(page)
    // Navigate first, then evaluate-clear (runs once, not on every reload)
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Handle ResumePrompt after reload with empty state (shouldn't appear, but just in case)
    const resumeModal = page.getByRole('dialog', { name: 'Resume Game?' })
    if (await resumeModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'New Game' }).click()
    }
    await provide(gp)
  },
})

export { expect } from '@playwright/test'
