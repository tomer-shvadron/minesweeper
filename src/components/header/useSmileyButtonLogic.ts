import { useGameStore } from '@/stores/game.store'
import { useUIStore } from '@/stores/ui.store'
import type { GameStatus } from '@/types/game.types'

const EMOJI: Record<GameStatus | 'nervous', string> = {
  idle: '🙂',
  playing: '🙂',
  won: '😎',
  lost: '😵',
  nervous: '😮',
}

export const useSmileyButtonLogic = () => {
  const status = useGameStore((s) => s.status)
  const isPressingCell = useGameStore((s) => s.isPressingCell)
  const openNewGameModal = useUIStore((s) => s.openNewGameModal)

  const emoji = isPressingCell && status === 'playing' ? EMOJI.nervous : EMOJI[status]

  return {
    emoji,
    label: 'New game',
    onPress: openNewGameModal,
  }
}
