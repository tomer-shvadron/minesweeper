import { useMineCounterLogic } from './useMineCounterLogic'

import { LcdDisplay } from '@/components/ui/LcdDisplay'

export const MineCounter = () => {
  const { minesRemaining } = useMineCounterLogic()
  return (
    <div data-testid="mine-counter">
      <LcdDisplay value={minesRemaining} />
    </div>
  )
}
