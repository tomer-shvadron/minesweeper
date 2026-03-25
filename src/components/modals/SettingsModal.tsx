import { useSettingsModalLogic } from './useSettingsModalLogic'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
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
        <RadioGroup
          value={theme}
          onValueChange={(v) => setTheme(v as typeof theme)}
          className="theme-options"
        >
          {(['xp', 'dark'] as const).map((t) => (
            <label key={t} className="theme-option">
              <RadioGroupItem value={t} className="preset-radio" />
              <span>{t === 'xp' ? 'Classic XP' : 'Dark'}</span>
            </label>
          ))}
        </RadioGroup>
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
