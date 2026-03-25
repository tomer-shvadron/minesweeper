import { useResumePromptLogic } from './useResumePromptLogic'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export const ResumePrompt = () => {
  const { isOpen, config, timeStr, handleResume, handleNewGame } = useResumePromptLogic()

  return (
    <Modal isOpen={isOpen} title="Resume Game?" onClose={handleResume}>
      <div className="modal-section">
        <p className="resume-info">You have an unfinished game in progress:</p>
        <p className="resume-details">
          {config.rows}×{config.cols}, {config.mines} mines — {timeStr} elapsed
        </p>
      </div>
      <div className="modal-actions">
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
