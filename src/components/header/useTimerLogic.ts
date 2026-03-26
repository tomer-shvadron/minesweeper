import { useEffect } from 'react'

import { useGameStore } from '@/stores/game.store'

export const useTimerLogic = () => {
  const elapsedSeconds = useGameStore((s) => s.elapsedSeconds)
  const status = useGameStore((s) => s.status)
  const tick = useGameStore((s) => s.tick)

  useEffect(() => {
    if (status !== 'playing') {
      return
    }
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [status, tick])

  return { elapsedSeconds }
}
