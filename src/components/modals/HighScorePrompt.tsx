import { useHighScorePromptLogic } from './useHighScorePromptLogic'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatTime } from '@/utils/time.utils'

export const HighScorePrompt = () => {
  const { isOpen, timeSeconds, name, setName, handleSubmit, handleDismiss } =
    useHighScorePromptLogic()

  return (
    <Modal isOpen={isOpen} title="New High Score!" onClose={handleDismiss}>
      <div className="modal-section">
        <p className="highscore-time">
          Your time: <strong>{formatTime(timeSeconds)}</strong>
        </p>
        <p className="highscore-prompt">Enter your name:</p>
        <input
          type="text"
          className="xp-input highscore-name-input"
          value={name}
          maxLength={20}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      <div className="modal-actions">
        <Button variant="primary" onClick={handleSubmit}>
          Save
        </Button>
        <Button variant="secondary" onClick={handleDismiss}>
          Skip
        </Button>
      </div>
    </Modal>
  )
}
