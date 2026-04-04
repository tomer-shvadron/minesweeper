import { useState } from 'react';

import {
  DIFFICULTY_PRESETS,
  MAX_COLS,
  MAX_ROWS,
  MIN_COLS,
  MIN_MINES,
  MIN_ROWS,
  detectPreset,
} from '@/constants/game.constants';
import { useGameLayout } from '@/hooks/useGameLayout';
import { useGameStore } from '@/stores/game.store';
import { useSettingsStore } from '@/stores/settings.store';
import { useUIStore } from '@/stores/ui.store';

type Preset = 'beginner' | 'intermediate' | 'expert' | 'custom';

/** Parse a string to a clamped integer, handling NaN, Infinity, floats, and empty strings. */
function sanitizeInt(raw: string, fallback: number, min: number, max: number): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export const useNewGameModalLogic = () => {
  const { layoutMode } = useGameLayout();
  const startNewGame = useGameStore((s) => s.startNewGame);
  const currentConfig = useGameStore((s) => s.config);
  const closeModal = useUIStore((s) => s.closeNewGameModal);
  const noGuessMode = useSettingsStore((s) => s.noGuessMode);
  const setNoGuessMode = useSettingsStore((s) => s.setNoGuessMode);

  const [selectedPreset, setSelectedPreset] = useState<Preset>(() => detectPreset(currentConfig));

  // Raw string state — allows intermediate values while typing (e.g. "1" on the
  // way to "15"). Clamping only happens on blur or when Start is clicked.
  const [customRows, setCustomRows] = useState(String(currentConfig.rows));
  const [customCols, setCustomCols] = useState(String(currentConfig.cols));
  const [customMines, setCustomMines] = useState(String(currentConfig.mines));

  // Derived clamped numbers, used for maxMines computation and on Start.
  const parsedRows = sanitizeInt(customRows, MIN_ROWS, MIN_ROWS, MAX_ROWS);
  const parsedCols = sanitizeInt(customCols, MIN_COLS, MIN_COLS, MAX_COLS);
  const maxMines = parsedRows * parsedCols - 9;
  const parsedMines = sanitizeInt(customMines, MIN_MINES, MIN_MINES, maxMines);

  const handleCustomRows = (v: string) => {
    setCustomRows(v);
  };

  const handleCustomCols = (v: string) => {
    setCustomCols(v);
  };

  const handleCustomMines = (v: string) => {
    setCustomMines(v);
  };

  const handleCustomRowsBlur = () => {
    const rows = sanitizeInt(customRows, MIN_ROWS, MIN_ROWS, MAX_ROWS);
    setCustomRows(String(rows));
    const newMax = rows * parsedCols - 9;
    if (parsedMines > newMax) {
      setCustomMines(String(Math.max(MIN_MINES, newMax)));
    }
  };

  const handleCustomColsBlur = () => {
    const cols = sanitizeInt(customCols, MIN_COLS, MIN_COLS, MAX_COLS);
    setCustomCols(String(cols));
    const newMax = parsedRows * cols - 9;
    if (parsedMines > newMax) {
      setCustomMines(String(Math.max(MIN_MINES, newMax)));
    }
  };

  const handleCustomMinesBlur = () => {
    setCustomMines(String(sanitizeInt(customMines, MIN_MINES, MIN_MINES, maxMines)));
  };

  const handleStart = () => {
    if (selectedPreset === 'custom') {
      startNewGame({ rows: parsedRows, cols: parsedCols, mines: parsedMines });
    } else {
      startNewGame(DIFFICULTY_PRESETS[selectedPreset]);
    }
    closeModal();
  };

  return {
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
  };
};
