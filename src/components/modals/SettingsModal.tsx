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
    setTheme,
    setFlagMode,
    setSoundEnabled,
    setVolume,
    setAnimationsEnabled,
    closeModal,
  } = useSettingsModalLogic()

  return (
    <Modal isOpen={isOpen} title="Settings" onClose={closeModal}>
      <div className="modal-section">
        <p className="settings-group-label">Theme</p>
        <div className="theme-picker">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={theme === t ? 'theme-swatch theme-swatch--active' : 'theme-swatch'}
              onClick={() => setTheme(t)}
              aria-label={THEME_LABELS[t]}
              aria-pressed={theme === t}
            >
              <span
                className="theme-swatch__preview"
                style={
                  {
                    backgroundColor: THEME_PREVIEW[t].surface,
                    '--swatch-accent': THEME_PREVIEW[t].accent,
                  } as React.CSSProperties
                }
              />
              <span className="theme-swatch__label">{THEME_LABELS[t]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="modal-section">
        <p className="settings-group-label">Sound</p>
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

      <div className="modal-section">
        <p className="settings-group-label">Gameplay</p>
        <Toggle
          id="animations-toggle"
          label="Animations"
          checked={animationsEnabled}
          onChange={setAnimationsEnabled}
        />
        <Toggle
          id="flagmode-toggle"
          label="Flag + question mark cycle"
          checked={flagMode === 'flags-and-questions'}
          onChange={(v) => setFlagMode(v ? 'flags-and-questions' : 'flags-only')}
        />
      </div>

      <div className="modal-actions">
        <Button variant="primary" onClick={closeModal}>
          OK
        </Button>
      </div>
    </Modal>
  )
}
