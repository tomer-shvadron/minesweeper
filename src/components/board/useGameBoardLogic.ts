import { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import { useGameLayout } from '@/hooks/useGameLayout'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import { useGameStore } from '@/stores/game.store'
import { useSettingsStore } from '@/stores/settings.store'

export const useGameBoardLogic = () => {
  const board = useGameStore((s) => s.board)
  const status = useGameStore((s) => s.status)
  const gameKey = useGameStore((s) => s.gameKey)
  const mineRevealOrder = useGameStore((s) => s.mineRevealOrder)
  const lastChordReveal = useGameStore((s) => s.lastChordReveal)
  const clearChordReveal = useGameStore((s) => s.clearChordReveal)
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled)
  const { cellSize, boardWidth, boardHeight, config } = useGameLayout()
  const {
    scale,
    panX,
    panY,
    handlers: pinchHandlers,
    resetZoom,
  } = usePinchZoom(1, 5, boardWidth, boardHeight)

  const [boardEntering, setBoardEntering] = useState(false)

  useLayoutEffect(() => {
    if (!animationsEnabled) {
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoardEntering(true)
    const duration = (config.rows + config.cols - 2) * 8 + 300
    const timer = setTimeout(() => {
      setBoardEntering(false)
    }, duration)
    return () => {
      clearTimeout(timer)
    }
  }, [gameKey, animationsEnabled, config.rows, config.cols])

  useEffect(() => {
    if (!lastChordReveal) {
      return
    }
    const [or, oc] = lastChordReveal.origin
    const maxDist = lastChordReveal.cells.reduce((max, [r, c]) => {
      return Math.max(max, Math.max(Math.abs(r - or), Math.abs(c - oc)))
    }, 0)
    const timer = setTimeout(clearChordReveal, maxDist * 30 + 400)
    return () => {
      clearTimeout(timer)
    }
  }, [lastChordReveal, clearChordReveal])

  useEffect(() => {
    resetZoom()
  }, [boardWidth, boardHeight, resetZoom])

  // screen.orientation fires after the browser commits new dimensions, more reliable
  // than `resize` alone. Delay matches the 100ms recalculation in useGameLayout.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const handleOrientationChange = () => {
      timer = setTimeout(resetZoom, 150)
    }

    const orientationObj = window.screen?.orientation
    if (orientationObj) {
      orientationObj.addEventListener('change', handleOrientationChange)
    } else {
      window.addEventListener('orientationchange', handleOrientationChange)
    }

    return () => {
      clearTimeout(timer)
      if (orientationObj) {
        orientationObj.removeEventListener('change', handleOrientationChange)
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange)
      }
    }
  }, [resetZoom])

  useEffect(() => {
    if (status === 'won' || status === 'lost') {
      resetZoom()
    }
  }, [status, resetZoom])

  const mineRevealLookup = useMemo(
    () => new Map(mineRevealOrder.map(([r, c], i) => [`${r},${c}`, i])),
    [mineRevealOrder]
  )

  const chordRippleLookup = useMemo(() => {
    if (!lastChordReveal) {
      return new Map<string, number>()
    }
    const [or, oc] = lastChordReveal.origin
    return new Map(
      lastChordReveal.cells.map(([r, c]) => [
        `${r},${c}`,
        Math.max(Math.abs(r - or), Math.abs(c - oc)) * 30,
      ])
    )
  }, [lastChordReveal])

  return {
    board,
    config,
    cellSize,
    boardWidth,
    boardHeight,
    scale,
    panX,
    panY,
    pinchHandlers,
    boardEntering: animationsEnabled && boardEntering,
    mineRevealLookup: animationsEnabled ? mineRevealLookup : new Map<string, number>(),
    chordRippleLookup: animationsEnabled ? chordRippleLookup : new Map<string, number>(),
  }
}
