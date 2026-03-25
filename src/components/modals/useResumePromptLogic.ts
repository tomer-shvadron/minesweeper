import { createBoardKey } from '@/services/board.service'
import { useGameStore } from '@/stores/game.store'
import { useUIStore } from '@/stores/ui.store'
import { formatTime } from '@/utils/time.utils'

export const useResumePromptLogic = () => {
  const isOpen = useUIStore((s) => s.resumePromptOpen)
  const closeResumePrompt = useUIStore((s) => s.closeResumePrompt)
  const openNewGameModal = useUIStore((s) => s.openNewGameModal)
  const config = useGameStore((s) => s.config)
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds)
  const startNewGame = useGameStore((s) => s.startNewGame)

  const boardKey = createBoardKey(config)
  const timeStr = formatTime(elapsedSeconds)

  const handleResume = () => {
    closeResumePrompt()
  }

  const handleNewGame = () => {
    closeResumePrompt()
    startNewGame()
    openNewGameModal()
  }

  return { isOpen, boardKey, timeStr, config, handleResume, handleNewGame }
}
