import { useHighScorePromptLogic } from './useHighScorePromptLogic';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MAX_PLAYER_NAME_LENGTH } from '@/constants/ui.constants';
import { formatTime } from '@/utils/time.utils';

export const HighScorePrompt = () => {
  const { isOpen, timeSeconds, name, setName, handleSubmit, handleDismiss } =
    useHighScorePromptLogic();

  return (
    <Modal isOpen={isOpen} title="New High Score!" onClose={handleDismiss}>
      <div className="flex flex-col gap-3">
        <p className="text-base">
          Your time:{' '}
          <strong className="text-[var(--color-accent)]">{formatTime(timeSeconds)}</strong>
        </p>
        <label htmlFor="high-score-name" className="text-sm text-[var(--color-text-muted)]">
          Enter your name:
        </label>
        <input
          id="high-score-name"
          type="text"
          className="input-field w-full"
          value={name}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="primary" onClick={handleSubmit}>
          Save
        </Button>
        <Button variant="secondary" onClick={handleDismiss}>
          Skip
        </Button>
      </div>
    </Modal>
  );
};
