import { useNewGameModalLogic } from './useNewGameModalLogic'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { DIFFICULTY_PRESETS } from '@/constants/game.constants'
import { useUIStore } from '@/stores/ui.store'

const PRESETS = [
  { key: 'beginner', label: 'Beginner', detail: '9×9, 10 mines' },
  { key: 'intermediate', label: 'Intermediate', detail: '16×16, 40 mines' },
  { key: 'expert', label: 'Expert', detail: '30×16, 99 mines' },
  { key: 'custom', label: 'Custom', detail: 'Choose your own' },
] as const

export const NewGameModal = () => {
  const isOpen = useUIStore((s) => s.newGameModalOpen)
  const closeModal = useUIStore((s) => s.closeNewGameModal)
  const {
    selectedPreset,
    setSelectedPreset,
    customRows,
    customCols,
    customMines,
    maxMines,
    handleCustomRows,
    handleCustomCols,
    handleCustomMines,
    handleStart,
  } = useNewGameModalLogic()

  return (
    <Modal isOpen={isOpen} title="New Game" onClose={closeModal}>
      <div className="modal-section">
        <RadioGroup
          value={selectedPreset}
          onValueChange={(v) => setSelectedPreset(v as typeof selectedPreset)}
        >
          {PRESETS.map(({ key, label, detail }) => (
            <label key={key} className="preset-option">
              <RadioGroupItem value={key} className="preset-radio" />
              <span className="preset-label">{label}</span>
              <span className="preset-detail">{detail}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {selectedPreset === 'custom' && (
        <div className="modal-section custom-inputs">
          <div className="input-row">
            <label htmlFor="custom-rows">Rows</label>
            <input
              id="custom-rows"
              type="number"
              className="xp-input"
              value={customRows}
              min={5}
              max={30}
              onChange={(e) => handleCustomRows(Number(e.target.value))}
            />
          </div>
          <div className="input-row">
            <label htmlFor="custom-cols">Columns</label>
            <input
              id="custom-cols"
              type="number"
              className="xp-input"
              value={customCols}
              min={5}
              max={50}
              onChange={(e) => handleCustomCols(Number(e.target.value))}
            />
          </div>
          <div className="input-row">
            <label htmlFor="custom-mines">Mines</label>
            <input
              id="custom-mines"
              type="number"
              className="xp-input"
              value={customMines}
              min={1}
              max={maxMines}
              onChange={(e) => handleCustomMines(Number(e.target.value))}
            />
          </div>
          <p className="input-hint">Max mines: {maxMines}</p>
        </div>
      )}

      {selectedPreset !== 'custom' && (
        <div className="modal-section">
          <p>
            {DIFFICULTY_PRESETS[selectedPreset].rows} rows ×{' '}
            {DIFFICULTY_PRESETS[selectedPreset].cols} cols,{' '}
            {DIFFICULTY_PRESETS[selectedPreset].mines} mines
          </p>
        </div>
      )}

      <div className="modal-actions">
        <Button variant="primary" onClick={handleStart}>
          Start
        </Button>
        <Button variant="secondary" onClick={closeModal}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
