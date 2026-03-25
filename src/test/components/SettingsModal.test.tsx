import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsModal } from '@/components/modals/SettingsModal'

let mockIsOpen = true
const mockCloseSettings = vi.fn()

vi.mock('@/stores/ui.store', () => ({
  useUIStore: (selector: (s: object) => unknown) =>
    selector({
      settingsModalOpen: mockIsOpen,
      closeSettingsModal: mockCloseSettings,
    }),
}))

const mockSetTheme = vi.fn()
const mockSetFlagMode = vi.fn()
const mockSetSoundEnabled = vi.fn()
const mockSetVolume = vi.fn()
const mockSetAnimationsEnabled = vi.fn()

let mockSettings = {
  theme: 'xp' as const,
  flagMode: 'flags-only' as const,
  soundEnabled: true,
  volume: 0.5,
  animationsEnabled: true,
  setTheme: mockSetTheme,
  setFlagMode: mockSetFlagMode,
  setSoundEnabled: mockSetSoundEnabled,
  setVolume: mockSetVolume,
  setAnimationsEnabled: mockSetAnimationsEnabled,
}

vi.mock('@/stores/settings.store', () => ({
  useSettingsStore: (selector: (s: object) => unknown) => selector(mockSettings),
}))

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsOpen = true
    mockSettings = {
      theme: 'xp',
      flagMode: 'flags-only',
      soundEnabled: true,
      volume: 0.5,
      animationsEnabled: true,
      setTheme: mockSetTheme,
      setFlagMode: mockSetFlagMode,
      setSoundEnabled: mockSetSoundEnabled,
      setVolume: mockSetVolume,
      setAnimationsEnabled: mockSetAnimationsEnabled,
    }
  })

  it('renders nothing when closed', () => {
    mockIsOpen = false
    render(<SettingsModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders the Settings title when open', () => {
    render(<SettingsModal />)
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('shows Theme section with Classic XP and Dark options', () => {
    render(<SettingsModal />)
    expect(screen.getByText('Classic XP')).toBeTruthy()
    expect(screen.getByText('Dark')).toBeTruthy()
  })

  it('has Classic XP radio checked when theme is xp', () => {
    render(<SettingsModal />)
    const xpRadio = screen.getByRole('radio', { name: /classic xp/i })
    expect(xpRadio.getAttribute('data-state')).toBe('checked')
  })

  it('calls setTheme when Dark radio is selected', () => {
    render(<SettingsModal />)
    fireEvent.click(screen.getByRole('radio', { name: /dark/i }))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('shows Sound toggle checked when soundEnabled is true', () => {
    render(<SettingsModal />)
    const soundToggle = screen.getByRole('switch', { name: /sound effects/i })
    expect(soundToggle.getAttribute('data-state')).toBe('checked')
  })

  it('volume slider is enabled when sound is on', () => {
    render(<SettingsModal />)
    const slider = screen.getByRole('slider')
    expect(slider.getAttribute('data-disabled')).toBeNull()
  })

  it('volume slider is disabled when sound is off', () => {
    mockSettings = { ...mockSettings, soundEnabled: false }
    render(<SettingsModal />)
    const slider = screen.getByRole('slider')
    expect(slider.getAttribute('data-disabled')).toBe('')
  })

  it('calls closeModal when OK is clicked', () => {
    render(<SettingsModal />)
    fireEvent.click(screen.getByText('OK'))
    expect(mockCloseSettings).toHaveBeenCalledTimes(1)
  })
})
