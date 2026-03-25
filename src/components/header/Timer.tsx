import { useTimerLogic } from './useTimerLogic'

import { LcdDisplay } from '@/components/ui/LcdDisplay'

export const Timer = () => {
  const { elapsedSeconds } = useTimerLogic()
  return <LcdDisplay value={elapsedSeconds} />
}
