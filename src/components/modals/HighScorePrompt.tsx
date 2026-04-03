import { useHighScorePromptLogic } from './useHighScorePromptLogic';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RightSheet } from '@/components/ui/RightSheet';
import { MAX_PLAYER_NAME_LENGTH } from '@/constants/ui.constants';
import { formatTime } from '@/utils/time.utils';

const HighScoreContent = ({
  timeSeconds,
  name,
  setName,
  handleSubmit,
  handleDismiss,
}: {
  timeSeconds: number;
  name: string;
  setName: (v: string) => void;
  handleSubmit: () => void;
  handleDismiss: () => void;
}) => (
  <>
    <div className="flex flex-col gap-3">
      <p className="text-base">
        Your time: <strong className="text-[var(--color-accent)]">{formatTime(timeSeconds)}</strong>
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
  </>
);

export const HighScorePrompt = () => {
  const { layoutMode, isOpen, timeSeconds, name, setName, handleSubmit, handleDismiss } =
    useHighScorePromptLogic();

  const content = (
    <HighScoreContent
      timeSeconds={timeSeconds}
      name={name}
      setName={setName}
      handleSubmit={handleSubmit}
      handleDismiss={handleDismiss}
    />
  );

  if (layoutMode === 'desktop') {
    return (
      <Modal isOpen={isOpen} title="New High Score!" onClose={handleDismiss}>
        {content}
      </Modal>
    );
  }

  if (layoutMode === 'mobile-landscape') {
    return (
      <RightSheet isOpen={isOpen} title="New High Score!" onClose={handleDismiss}>
        {content}
      </RightSheet>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} title="New High Score!" onClose={handleDismiss}>
      {content}
    </BottomSheet>
  );
};
