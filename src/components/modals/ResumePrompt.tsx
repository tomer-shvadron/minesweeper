import { useResumePromptLogic } from './useResumePromptLogic'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export const ResumePrompt = () => {
  const { isOpen, config, timeStr, handleResume, handleNewGame } = useResumePromptLogic()

  return (
    <Modal isOpen={isOpen} title="Resume Game?" onClose={handleResume}>
      <div className="flex flex-col gap-[10px]">
        <p className="text-sm">You have an unfinished game in progress:</p>
        <p className="text-[0.9375rem] font-bold">
          {config.rows}×{config.cols}, {config.mines} mines — {timeStr} elapsed
        </p>
      </div>
      <div className="flex justify-end gap-1.5 px-3 py-2 pb-[10px]">
        <Button variant="primary" onClick={handleResume}>
          Resume
        </Button>
        <Button variant="secondary" onClick={handleNewGame}>
          New Game
        </Button>
      </div>
    </Modal>
  )
}
