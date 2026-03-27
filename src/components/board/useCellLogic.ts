import { useLongPress } from '@/hooks/useLongPress'
import { haptic } from '@/services/haptic.service'
import { playSound } from '@/services/sound.service'
import { useGameStore } from '@/stores/game.store'
import { useSettingsStore } from '@/stores/settings.store'
import type { CellState } from '@/types/game.types'

// Import getState so we can read lastRevealCount synchronously after dispatch
const getGameState = () => useGameStore.getState()

const NUMBER_COLOR_CLASSES: Record<number, string> = {
  1: 'text-[var(--color-n1)]',
  2: 'text-[var(--color-n2)]',
  3: 'text-[var(--color-n3)]',
  4: 'text-[var(--color-n4)]',
  5: 'text-[var(--color-n5)]',
  6: 'text-[var(--color-n6)]',
  7: 'text-[var(--color-n7)]',
  8: 'text-[var(--color-n8)]',
}

interface UseCellLogicProps {
  row: number
  col: number
  cell: CellState
  isZoomed: boolean
}

export const useCellLogic = ({ row, col, cell, isZoomed }: UseCellLogicProps) => {
  const revealCell = useGameStore((s) => s.revealCell)
  const flagCell = useGameStore((s) => s.flagCell)
  const chordClick = useGameStore((s) => s.chordClick)
  const setCellPressStart = useGameStore((s) => s.setCellPressStart)
  const setCellPressEnd = useGameStore((s) => s.setCellPressEnd)
  const status = useGameStore((s) => s.status)
  const flagMode = useSettingsStore((s) => s.flagMode)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const volume = useSettingsStore((s) => s.volume)
  const soundTheme = useSettingsStore((s) => s.soundTheme)
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled)

  const isGameOver = status === 'won' || status === 'lost'
  const allowQuestionMarks = flagMode === 'flags-and-questions'

  const handleTap = () => {
    if (isGameOver) {
      return
    }
    if (cell.isRevealed) {
      haptic('chord', hapticEnabled)
      chordClick(row, col)
      if (soundEnabled) {
        // Use the chord-revealed cell count for cascade detection
        const chordCells = getGameState().lastChordReveal?.cells.length ?? 1
        playSound('reveal', volume, { soundTheme, mineCount: cell.value, cascadeSize: chordCells })
      }
    } else {
      haptic('reveal', hapticEnabled)
      revealCell(row, col)
      if (soundEnabled) {
        const cascadeSize = getGameState().lastRevealCount
        playSound('reveal', volume, { soundTheme, mineCount: cell.value, cascadeSize })
      }
    }
  }

  const handleLongPress = () => {
    if (isGameOver || cell.isRevealed) {
      return
    }
    haptic(cell.isFlagged ? 'unflag' : 'flag', hapticEnabled)
    flagCell(row, col, allowQuestionMarks)
    if (soundEnabled) {
      playSound('flag', volume, { soundTheme })
    }
  }

  const longPressHandlers = useLongPress({
    onTap: handleTap,
    onLongPress: handleLongPress,
    disableSwipe: isZoomed,
  })

  const getContent = (): string => {
    if (!cell.isRevealed) {
      if (cell.isFlagged) {
        return '🚩'
      }
      if (cell.isQuestionMark) {
        return '?'
      }
      return ''
    }
    if (cell.isExploded) {
      return '💣'
    }
    if (cell.hasMine) {
      return '💣'
    }
    if (cell.value === 0) {
      return ''
    }
    return String(cell.value)
  }

  const isRaised = !cell.isRevealed
  const isExploded = cell.isExploded
  // Cell was correctly flagged — show a green ✓ badge on game over
  const isCorrectFlag = isGameOver && cell.isFlagged && cell.hasMine

  const containerClass = [
    'cell',
    isRaised
      ? 'shadow-[inset_2px_2px_0_var(--color-border-light),inset_-2px_-2px_0_var(--color-border-dark)]'
      : 'cell-revealed',
    isExploded ? 'cell-exploded' : '',
    !isGameOver && !isRaised ? 'cursor-default' : '',
    isGameOver ? 'cursor-default' : 'cursor-pointer',
  ]
    .filter(Boolean)
    .join(' ')

  const numberClass =
    cell.isRevealed && !cell.hasMine && cell.value > 0
      ? `font-bold ${NUMBER_COLOR_CLASSES[cell.value] ?? ''}`
      : ''

  return {
    content: getContent(),
    containerClass,
    numberClass,
    isCorrectFlag,
    handlers: {
      ...longPressHandlers,
      onMouseDown: () => setCellPressStart(),
      onMouseUp: () => setCellPressEnd(),
      onMouseLeave: () => setCellPressEnd(),
    },
  }
}
