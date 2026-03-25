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
const { mockUseLeaderboardStore, mockSetState } = vi.hoisted(() => {
  const mockSetState = vi.fn()
  const mockUseLeaderboardStore = Object.assign(
    (selector: (s: object) => unknown) => selector({ entries: mockUseLeaderboardStore._entries }),
    { setState: mockSetState, _entries: {} as Record<string, unknown[]> }
  )
  return { mockUseLeaderboardStore, mockSetState }
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
    mockUseLeaderboardStore.setState = mockSetState
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
    expect(screen.getByText(/no scores yet/i)).toBeTruthy()
  })

  it('renders scores when entries exist', () => {
    mockUseLeaderboardStore._entries = {
      beginner: [{ name: 'Alice', timeSeconds: 45, date: '2025-01-01T00:00:00.000Z' }],
    }
    render(<LeaderboardModal />)
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('45s')).toBeTruthy()
  })

  it('does not show Clear button when no entries', () => {
    render(<LeaderboardModal />)
    expect(screen.queryByText('Clear')).toBeNull()
  })

  it('shows Clear button when entries exist', () => {
    mockUseLeaderboardStore._entries = {
      beginner: [{ name: 'Bob', timeSeconds: 30, date: '2025-01-01T00:00:00.000Z' }],
    }
    render(<LeaderboardModal />)
    expect(screen.getByText('Clear')).toBeTruthy()
  })

  it('calls setState when Clear is clicked', () => {
    mockUseLeaderboardStore._entries = {
      beginner: [{ name: 'Bob', timeSeconds: 30, date: '2025-01-01T00:00:00.000Z' }],
    }
    render(<LeaderboardModal />)
    fireEvent.click(screen.getByText('Clear'))
    expect(mockSetState).toHaveBeenCalledTimes(1)
  })

  it('calls closeModal when Close is clicked', () => {
    render(<LeaderboardModal />)
    fireEvent.click(screen.getByText('Close'))
    expect(mockCloseLeaderboard).toHaveBeenCalledTimes(1)
  })

  it('switches tab when another tab is clicked', () => {
    render(<LeaderboardModal />)
    const expertTab = screen.getByText('Expert')
    fireEvent.click(expertTab)
    expect(expertTab.className).toContain('leaderboard-tab--active')
  })
})
