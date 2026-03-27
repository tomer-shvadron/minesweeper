import { useTimerLogic } from './useTimerLogic';

import { LcdDisplay } from '@/components/ui/LcdDisplay';

export const Timer = () => {
  const { elapsedSeconds } = useTimerLogic();
  return (
    <div data-testid="timer">
      <LcdDisplay value={elapsedSeconds} />
    </div>
  );
};
