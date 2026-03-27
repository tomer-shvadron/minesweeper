import type React from 'react'

import { useSettingsModalLogic } from './useSettingsModalLogic'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { THEME_LABELS, THEME_PREVIEW, THEMES } from '@/constants/theme.constants'
import { useUIStore } from '@/stores/ui.store'
export const SettingsModal = () => {
  const isOpen = useUIStore((s) => s.settingsModalOpen)
  const {
    theme,
    flagMode,
    soundEnabled,
    volume,
    animationsEnabled,
    hapticEnabled,
    noGuessMode,
    hapticSupported,
    setTheme,
    setFlagMode,
    setSoundEnabled,
    setVolume,
    setAnimationsEnabled,
    setHapticEnabled,
    setNoGuessMode,
    openKeyboardModal,
    closeModal,
  } = useSettingsModalLogic()

  return (
    <Modal isOpen={isOpen} title="Settings" onClose={closeModal}>
      <div className="flex flex-col gap-[10px]">
        <p className="mb-1 border-b border-[var(--color-border-dark)] pb-[3px] text-[0.8125rem] font-bold tracking-[0.05em] text-[var(--color-text-muted)] uppercase">
          Theme
        </p>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
              onClick={() => setTheme(t)}
              aria-label={THEME_LABELS[t]}
              aria-pressed={theme === t}
            >
              <span
                className={`relative block h-[38px] w-11 overflow-hidden rounded-md border-2 shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-[border-color] duration-100 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[10px] after:bg-[var(--swatch-accent)] after:content-[''] ${theme === t ? 'border-[var(--swatch-accent)]' : 'border-transparent'}`}
                style={
                  {
                    backgroundColor: THEME_PREVIEW[t].surface,
                    '--swatch-accent': THEME_PREVIEW[t].accent,
                  } as React.CSSProperties
                }
              />
              <span className="max-w-11 overflow-hidden text-center text-[0.5625rem] leading-[1.2] text-ellipsis whitespace-nowrap text-[var(--color-text)]">
                {THEME_LABELS[t]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        <p className="mb-1 border-b border-[var(--color-border-dark)] pb-[3px] text-[0.8125rem] font-bold tracking-[0.05em] text-[var(--color-text-muted)] uppercase">
          Sound
        </p>
        <Toggle
          id="sound-toggle"
          label="Sound effects"
          checked={soundEnabled}
          onChange={setSoundEnabled}
        />
        <Slider
          id="volume-slider"
          label="Volume"
          value={volume}
          onChange={setVolume}
          disabled={!soundEnabled}
        />
      </div>

      <div className="flex flex-col gap-[10px]">
        <p className="mb-1 border-b border-[var(--color-border-dark)] pb-[3px] text-[0.8125rem] font-bold tracking-[0.05em] text-[var(--color-text-muted)] uppercase">
          Gameplay
        </p>
        <Toggle
          id="animations-toggle"
          label="Animations"
          checked={animationsEnabled}
          onChange={setAnimationsEnabled}
        />
        {hapticSupported && (
          <Toggle
            id="haptic-toggle"
            label="Haptic feedback"
            checked={hapticEnabled}
            onChange={setHapticEnabled}
          />
        )}
        <Toggle
          id="no-guess-toggle"
          label="No guessing (logic-solvable boards)"
          checked={noGuessMode}
          onChange={setNoGuessMode}
        />
        <Toggle
          id="flagmode-toggle"
          label="Flag + question mark cycle"
          checked={flagMode === 'flags-and-questions'}
          onChange={(v) => setFlagMode(v ? 'flags-and-questions' : 'flags-only')}
        />
        <div className="flex items-center justify-between gap-3 text-base">
          <span className="flex-1">Keyboard shortcuts</span>
          <button
            type="button"
            onClick={openKeyboardModal}
            className="cursor-pointer border border-[var(--color-border-dark)] bg-[var(--color-surface)] px-2.5 py-0.5 text-sm shadow-[inset_1px_1px_0_var(--color-border-light),inset_-1px_-1px_0_var(--color-border-dark)] active:shadow-[inset_-1px_-1px_0_var(--color-border-light),inset_1px_1px_0_var(--color-border-dark)]"
          >
            Configure →
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-1.5 px-3 py-2 pb-[10px]">
        <Button variant="primary" onClick={closeModal}>
          OK
        </Button>
      </div>
    </Modal>
  )
}
