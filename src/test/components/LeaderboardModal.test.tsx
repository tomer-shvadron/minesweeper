import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LeaderboardModal } from '@/components/modals/LeaderboardModal'

// ---- ui.store mock ----
let mockIsOpen = true
const mockCloseLeaderboard = vi.fn()

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      leaderboardModalOpen: mockIsOpen,
      closeLeaderboardModal: mockCloseLeaderboard,
    }),
}))

// ---- leaderboard.store mock ----
// We use vi.hoisted so the mock object exists before the hoisted vi.mock factory runs
const { mockUseLeaderboardStore } = vi.hoisted(() => {
  const mockUseLeaderboardStore = Object.assign(
    (selector: (s: object) => unknown) =>
      selector({
        entries: mockUseLeaderboardStore._entries,
        gamesPlayed: mockUseLeaderboardStore._gamesPlayed,
      }),
    {
      _entries: {} as Record<string, unknown[]>,
      _gamesPlayed: {} as Record<string, number>,
    }
  )
  return { mockUseLeaderboardStore }
})

vi.mock('@/stores/leaderboard.store', () => ({
  useLeaderboardStore: mockUseLeaderboardStore,
}))

// ---- game.store mock ----
vi.mock('@/stores/game.store', () => ({
  useGameStore: (selector: (s: object) => unknown) =>
    selector({
      config: { rows: 9, cols: 9, mines: 10 },
    }),
}))

describe('LeaderboardModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOpen = true
    mockUseLeaderboardStore._entries = {}
    mockUseLeaderboardStore._gamesPlayed = {}
  })

  it('renders nothing when closed', () => {
    mockIsOpen = false
    render(<LeaderboardModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders the Best Times title when open', () => {
    render(<LeaderboardModal />)
    expect(screen.getByText('Best Times')).toBeTruthy()
  })

  it('shows default preset tabs', () => {
    render(<LeaderboardModal />)
    expect(screen.getByText('Beginner')).toBeTruthy()
    expect(screen.getByText('Inter.')).toBeTruthy()
    expect(screen.getByText('Expert')).toBeTruthy()
  })

  it('shows "No scores yet" when leaderboard is empty', () => {
    render(<LeaderboardModal />)
    expect(screen.getByText(/play a game/i)).toBeTruthy()
  })

  it('renders scores when entries exist', () => {
    mockUseLeaderboardStore._entries = {
      beginner: [{ name: 'Alice', timeSeconds: 45, date: '2025-01-01T00:00:00.000Z' }],
    }
    render(<LeaderboardModal />)
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('45s')).toBeTruthy()
  })

  it('does not show Clear or Close buttons', () => {
    render(<LeaderboardModal />)
    expect(screen.queryByText('Clear')).toBeNull()
    expect(screen.queryByText('Close')).toBeNull()
  })

  it('switches tab when another tab is clicked', () => {
    render(<LeaderboardModal />)
    const expertTab = screen.getByText('Expert')
    fireEvent.click(expertTab)
    expect(expertTab.className).toContain('font-bold')
  })
})
