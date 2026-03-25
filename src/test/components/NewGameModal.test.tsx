import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NewGameModal } from '@/components/modals/NewGameModal'

// ---- ui.store mock ----
let mockIsOpen = true
const mockClose = vi.fn()

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      newGameModalOpen: mockIsOpen,
      closeNewGameModal: mockClose,
    }),
}))

// ---- game.store mock ----
const mockStartNewGame = vi.fn()
let mockConfig = { rows: 9, cols: 9, mines: 10 }

vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({
      startNewGame: mockStartNewGame,
      config: mockConfig,
    }),
}))

describe('NewGameModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOpen = true
    mockConfig = { rows: 9, cols: 9, mines: 10 }
  })

  it('renders nothing when closed', () => {
    mockIsOpen = false
    render(<NewGameModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders the modal title when open', () => {
    render(<NewGameModal />)
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('New Game')).toBeTruthy()
  })

  it('shows all difficulty preset options', () => {
    render(<NewGameModal />)
    expect(screen.getByLabelText('Beginner', { exact: false })).toBeTruthy()
    expect(screen.getByLabelText('Intermediate', { exact: false })).toBeTruthy()
    expect(screen.getByLabelText('Expert', { exact: false })).toBeTruthy()
    expect(screen.getByLabelText('Custom', { exact: false })).toBeTruthy()
  })

  it('pre-selects Beginner when current config matches beginner preset', () => {
    render(<NewGameModal />)
    const beginnerRadio = screen.getByDisplayValue('beginner')
    expect((beginnerRadio as HTMLInputElement).checked).toBe(true)
  })

  it('calls startNewGame and closeModal when Start is clicked', () => {
    render(<NewGameModal />)
    fireEvent.click(screen.getByText('Start'))
    expect(mockStartNewGame).toHaveBeenCalledTimes(1)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('calls closeModal when Cancel is clicked', () => {
    render(<NewGameModal />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(mockStartNewGame).not.toHaveBeenCalled()
  })

  it('shows custom inputs when Custom preset is selected', () => {
    render(<NewGameModal />)
    fireEvent.click(screen.getByDisplayValue('custom'))
    expect(screen.getByLabelText('Rows')).toBeTruthy()
    expect(screen.getByLabelText('Columns')).toBeTruthy()
    expect(screen.getByLabelText('Mines')).toBeTruthy()
  })

  it('does not show custom inputs when a preset is selected', () => {
    render(<NewGameModal />)
    expect(screen.queryByLabelText('Rows')).toBeNull()
  })
})
