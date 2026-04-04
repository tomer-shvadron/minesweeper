import { useNewGameModalLogic } from './useNewGameModalLogic';

import { Button } from '@/components/ui/Button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
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
    layoutMode,
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
    <ResponsiveModal isOpen={isOpen} title="New Game" onClose={closeModal} layoutMode={layoutMode}>
      <div className="flex flex-col gap-1">
        <RadioGroup
          value={selectedPreset}
          onValueChange={(v) => setSelectedPreset(v as typeof selectedPreset)}
        >
          {PRESETS.map(({ key, label, detail }) => (
            <label key={key} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
              <RadioGroupItem
                value={key}
                className="preset-radio flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] data-[state=checked]:border-[var(--color-accent)] data-[state=checked]:after:block data-[state=checked]:after:h-2 data-[state=checked]:after:w-2 data-[state=checked]:after:rounded-full data-[state=checked]:after:bg-[var(--color-accent)] data-[state=checked]:after:content-['']"
              />
              <span className="cursor-pointer text-base font-semibold">{label}</span>
              <span className="ml-auto text-sm text-[var(--color-text-muted)]">{detail}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {selectedPreset === 'custom' && (
        <div className="flex flex-col gap-2 pt-1 pl-7">
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="custom-rows" className="w-14">
              Rows
            </label>
            <input
              id="custom-rows"
              type="number"
              className="input-field"
              value={customRows}
              min={5}
              max={30}
              onChange={(e) => handleCustomRows(e.target.value)}
              onBlur={handleCustomRowsBlur}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="custom-cols" className="w-14">
              Columns
            </label>
            <input
              id="custom-cols"
              type="number"
              className="input-field"
              value={customCols}
              min={5}
              max={50}
              onChange={(e) => handleCustomCols(e.target.value)}
              onBlur={handleCustomColsBlur}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="custom-mines" className="w-14">
              Mines
            </label>
            <input
              id="custom-mines"
              type="number"
              className="input-field"
              value={customMines}
              min={1}
              max={maxMines}
              onChange={(e) => handleCustomMines(e.target.value)}
              onBlur={handleCustomMinesBlur}
            />
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">Max mines: {maxMines}</p>
        </div>
      )}

      {selectedPreset !== 'custom' && (
        <p className="text-sm text-[var(--color-text-muted)]">
          {DIFFICULTY_PRESETS[selectedPreset].rows} rows × {DIFFICULTY_PRESETS[selectedPreset].cols}{' '}
          cols, {DIFFICULTY_PRESETS[selectedPreset].mines} mines
        </p>
      )}

      <Toggle
        id="no-guess-toggle"
        label="No guessing (logic-solvable board)"
        checked={noGuessMode}
        onChange={setNoGuessMode}
      />

      <div className="mt-auto flex justify-end gap-2 pt-2">
        <Button variant="primary" onClick={handleStart}>
          Start
        </Button>
        <Button variant="secondary" onClick={closeModal}>
          Cancel
        </Button>
      </div>
    </ResponsiveModal>
  );
};
