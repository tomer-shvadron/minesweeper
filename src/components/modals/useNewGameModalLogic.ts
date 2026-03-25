import { useState } from 'react'

import {
  DIFFICULTY_PRESETS,
  MAX_COLS,
  MAX_ROWS,
  MIN_COLS,
  MIN_MINES,
  MIN_ROWS,
} from '@/constants/game.constants'
import { useGameStore } from '@/stores/game.store'
import { useUIStore } from '@/stores/ui.store'

type Preset = 'beginner' | 'intermediate' | 'expert' | 'custom'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export const useNewGameModalLogic = () => {
  const startNewGame = useGameStore((s) => s.startNewGame)
  const currentConfig = useGameStore((s) => s.config)
  const closeModal = useUIStore((s) => s.closeNewGameModal)

  const detectCurrentPreset = (): Preset => {
    for (const [key, preset] of Object.entries(DIFFICULTY_PRESETS)) {
      if (
        preset.rows === currentConfig.rows &&
        preset.cols === currentConfig.cols &&
        preset.mines === currentConfig.mines
      ) {
        return key as Preset
      }
    }
    return 'custom'
  }

  const [selectedPreset, setSelectedPreset] = useState<Preset>(detectCurrentPreset)
  const [customRows, setCustomRows] = useState(currentConfig.rows)
  const [customCols, setCustomCols] = useState(currentConfig.cols)
  const [customMines, setCustomMines] = useState(currentConfig.mines)

  const maxMines = customRows * customCols - 9

  const handleCustomRows = (v: number) => {
    const rows = clamp(v, MIN_ROWS, MAX_ROWS)
    setCustomRows(rows)
    const newMax = rows * customCols - 9
    if (customMines > newMax) {
      setCustomMines(Math.max(MIN_MINES, newMax))
    }
  }

  const handleCustomCols = (v: number) => {
    const cols = clamp(v, MIN_COLS, MAX_COLS)
    setCustomCols(cols)
    const newMax = customRows * cols - 9
    if (customMines > newMax) {
      setCustomMines(Math.max(MIN_MINES, newMax))
    }
  }

  const handleCustomMines = (v: number) => {
    setCustomMines(clamp(v, MIN_MINES, maxMines))
  }

  const handleStart = () => {
    if (selectedPreset === 'custom') {
      startNewGame({ rows: customRows, cols: customCols, mines: customMines })
    } else {
      startNewGame(DIFFICULTY_PRESETS[selectedPreset])
    }
    closeModal()
  }

  return {
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
  }
}
