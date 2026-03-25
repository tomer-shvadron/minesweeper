import { useCallback, useRef, useState } from 'react'

function getTouchDistance(touches: React.TouchList): number {
  const t1 = touches[0]
  const t2 = touches[1]
  if (!t1 || !t2) {
    return 0
  }
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

/**
 * Detects a two-finger pinch gesture and returns a scale factor.
 * Spread the returned handlers onto the element you want to be zoomable.
 */
export function usePinchZoom(minScale = 1, maxScale = 5) {
  const [scale, setScale] = useState(1)
  const lastDistanceRef = useRef<number | null>(null)
  const baseScaleRef = useRef(1)

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        lastDistanceRef.current = getTouchDistance(e.touches)
        baseScaleRef.current = scale
      }
    },
    [scale]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2 || lastDistanceRef.current === null) {
        return
      }
      e.preventDefault() // prevent page zoom
      const newDist = getTouchDistance(e.touches)
      const ratio = newDist / lastDistanceRef.current
      const newScale = Math.min(maxScale, Math.max(minScale, baseScaleRef.current * ratio))
      setScale(newScale)
    },
    [minScale, maxScale]
  )

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastDistanceRef.current = null
    }
  }, [])

  const resetZoom = useCallback(() => setScale(1), [])

  return { scale, handlers: { onTouchStart, onTouchMove, onTouchEnd }, resetZoom }
}
