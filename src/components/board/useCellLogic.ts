import { useLongPress } from '@/hooks/useLongPress'
import { useGameStore } from '@/stores/game.store'
import { useSettingsStore } from '@/stores/settings.store'
import type { CellState } from '@/types/game.types'

// Maps mine number (1–8) to CSS variable classes
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
}

export const useCellLogic = ({ row, col, cell }: UseCellLogicProps) => {
  const revealCell = useGameStore((s) => s.revealCell)
  const flagCell = useGameStore((s) => s.flagCell)
  const chordClick = useGameStore((s) => s.chordClick)
  const setCellPressStart = useGameStore((s) => s.setCellPressStart)
  const setCellPressEnd = useGameStore((s) => s.setCellPressEnd)
  const status = useGameStore((s) => s.status)
  const flagMode = useSettingsStore((s) => s.flagMode)

  const isGameOver = status === 'won' || status === 'lost'
  const allowQuestionMarks = flagMode === 'flags-and-questions'

  const handleTap = () => {
    if (isGameOver) return
    if (cell.isRevealed) {
      chordClick(row, col)
    } else {
      revealCell(row, col)
    }
  }

  const handleLongPress = () => {
    if (isGameOver || cell.isRevealed) return
    flagCell(row, col, allowQuestionMarks)
  }

  const longPressHandlers = useLongPress({
    onTap: handleTap,
    onLongPress: handleLongPress,
  })

  // --- Content ---
  const getContent = (): string => {
    if (!cell.isRevealed) {
      if (cell.isFlagged) return '🚩'
      if (cell.isQuestionMark) return '?'
      return ''
    }
    if (cell.isExploded) return '💣'
    if (cell.hasMine) return '💣'
    if (cell.value === 0) return ''
    return String(cell.value)
  }

  // --- CSS classes ---
  const isRaised = !cell.isRevealed
  const isExploded = cell.isExploded

  const containerClass = [
    'cell',
    isRaised ? 'cell-raised' : 'cell-revealed',
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
    handlers: {
      ...longPressHandlers,
      onMouseDown: () => setCellPressStart(),
      onMouseUp: () => setCellPressEnd(),
      onMouseLeave: () => setCellPressEnd(),
    },
  }
}
