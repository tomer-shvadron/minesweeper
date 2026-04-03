import { useResumePromptLogic } from './useResumePromptLogic';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export const ResumePrompt = () => {
  const { isOpen, config, timeStr, handleResume, handleNewGame } = useResumePromptLogic();

  return (
    <Modal isOpen={isOpen} title="Resume Game?" onClose={handleResume}>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-[var(--color-text-muted)]">
          You have an unfinished game in progress:
        </p>
        <p className="text-base font-semibold">
          {config.rows}×{config.cols}, {config.mines} mines — {timeStr} elapsed
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="primary" onClick={handleResume}>
          Resume
        </Button>
        <Button variant="secondary" onClick={handleNewGame}>
          New Game
        </Button>
      </div>
    </Modal>
  );
};
