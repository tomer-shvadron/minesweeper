import { useGameStore } from '@/stores/game.store'
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
  const startNewGame = useGameStore((s) => s.startNewGame)
  const config = useGameStore((s) => s.config)

  const emoji = isPressingCell && status === 'playing' ? EMOJI.nervous : EMOJI[status]

  return {
    emoji,
    label: 'New game',
    onPress: () => startNewGame(config),
  }
}
