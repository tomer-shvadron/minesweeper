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
      <div className="flex flex-col gap-[10px]">
        <p className="text-base">
          Your time: <strong>{formatTime(timeSeconds)}</strong>
        </p>
        <p className="text-[0.9375rem]">Enter your name:</p>
        <input
          type="text"
          className="xp-input w-full"
          value={name}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>
      <div className="flex justify-end gap-1.5 px-3 py-2 pb-[10px]">
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
