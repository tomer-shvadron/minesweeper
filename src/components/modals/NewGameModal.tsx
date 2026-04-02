import { useNewGameModalLogic } from './useNewGameModalLogic';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Toggle } from '@/components/ui/Toggle';
import { DIFFICULTY_PRESETS } from '@/constants/game.constants';
import { useUIStore } from '@/stores/ui.store';

const PRESETS = [
  { key: 'beginner', label: 'Beginner', detail: '9×9, 10 mines' },
  { key: 'intermediate', label: 'Intermediate', detail: '16×16, 40 mines' },
  { key: 'expert', label: 'Expert', detail: '30×16, 99 mines' },
  { key: 'custom', label: 'Custom', detail: 'Choose your own' },
] as const;

export const NewGameModal = () => {
  const isOpen = useUIStore((s) => s.activeModal === 'newGame');
  const closeModal = useUIStore((s) => s.closeNewGameModal);
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
    handleCustomRowsBlur,
    handleCustomColsBlur,
    handleCustomMinesBlur,
    handleStart,
    noGuessMode,
    setNoGuessMode,
  } = useNewGameModalLogic();

  return (
    <Modal isOpen={isOpen} title="New Game" onClose={closeModal}>
      <div className="flex flex-col gap-[10px]">
        <RadioGroup
          value={selectedPreset}
          onValueChange={(v) => setSelectedPreset(v as typeof selectedPreset)}
        >
          {PRESETS.map(({ key, label, detail }) => (
            <label key={key} className="flex items-center gap-2 px-0.5 py-1">
              <RadioGroupItem
                value={key}
                className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border-dark)] bg-white data-[state=checked]:border-[var(--color-n4)] data-[state=checked]:after:block data-[state=checked]:after:h-[7px] data-[state=checked]:after:w-[7px] data-[state=checked]:after:rounded-full data-[state=checked]:after:bg-[var(--color-n4)] data-[state=checked]:after:content-['']"
              />
              <span className="cursor-pointer text-base font-bold">{label}</span>
              <span className="ml-auto text-[0.8125rem] text-[var(--color-border-darker)]">
                {detail}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {selectedPreset === 'custom' && (
        <div className="flex flex-col gap-[6px] pt-1 pl-[22px]">
          <div className="flex items-center gap-2 text-[0.8125rem]">
            <label htmlFor="custom-rows" className="w-[50px]">
              Rows
            </label>
            <input
              id="custom-rows"
              type="number"
              className="xp-input"
              value={customRows}
              min={5}
              max={30}
              onChange={(e) => handleCustomRows(e.target.value)}
              onBlur={handleCustomRowsBlur}
            />
          </div>
          <div className="flex items-center gap-2 text-[0.8125rem]">
            <label htmlFor="custom-cols" className="w-[50px]">
              Columns
            </label>
            <input
              id="custom-cols"
              type="number"
              className="xp-input"
              value={customCols}
              min={5}
              max={50}
              onChange={(e) => handleCustomCols(e.target.value)}
              onBlur={handleCustomColsBlur}
            />
          </div>
          <div className="flex items-center gap-2 text-[0.8125rem]">
            <label htmlFor="custom-mines" className="w-[50px]">
              Mines
            </label>
            <input
              id="custom-mines"
              type="number"
              className="xp-input"
              value={customMines}
              min={1}
              max={maxMines}
              onChange={(e) => handleCustomMines(e.target.value)}
              onBlur={handleCustomMinesBlur}
            />
          </div>
          <p className="text-[0.8125rem]">Max mines: {maxMines}</p>
        </div>
      )}

      {selectedPreset !== 'custom' && (
        <div className="flex flex-col gap-[10px]">
          <p>
            {DIFFICULTY_PRESETS[selectedPreset].rows} rows ×{' '}
            {DIFFICULTY_PRESETS[selectedPreset].cols} cols,{' '}
            {DIFFICULTY_PRESETS[selectedPreset].mines} mines
          </p>
        </div>
      )}

      <Toggle
        id="no-guess-toggle"
        label="No guessing (logic-solvable board)"
        checked={noGuessMode}
        onChange={setNoGuessMode}
      />

      <div className="flex justify-end gap-1.5 px-3 py-2 pb-[10px]">
        <Button variant="primary" onClick={handleStart}>
          Start
        </Button>
        <Button variant="secondary" onClick={closeModal}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
