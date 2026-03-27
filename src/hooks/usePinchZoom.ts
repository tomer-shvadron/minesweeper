import { useCallback, useRef, useState } from 'react'

function getTouchDistance(touches: React.TouchList): number {
  const t1 = touches[0]
  const t2 = touches[1]
  if (!t1 || !t2) {
    return 0
  }
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

const PAN_THRESHOLD = 10

export function usePinchZoom(minScale = 1, maxScale = 5, boardWidth = 0, boardHeight = 0) {
  const [scale, setScale] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  const scaleRef = useRef(1)
  const panXRef = useRef(0)
  const panYRef = useRef(0)

  const lastDistanceRef = useRef<number | null>(null)
  const baseScaleRef = useRef(1)
  const lastPanPosRef = useRef<{ x: number; y: number } | null>(null)
  const isPanningRef = useRef(false)

  const clampPan = useCallback(
    (x: number, y: number, s: number) => ({
      x: Math.min((boardWidth / 2) * (s - 1), Math.max(-((boardWidth / 2) * (s - 1)), x)),
      y: Math.min((boardHeight / 2) * (s - 1), Math.max(-((boardHeight / 2) * (s - 1)), y)),
    }),
    [boardWidth, boardHeight]
  )

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDistanceRef.current = getTouchDistance(e.touches)
      baseScaleRef.current = scaleRef.current
      lastPanPosRef.current = null
    } else if (e.touches.length === 1) {
      const touch = e.touches[0]
      if (touch) {
        lastPanPosRef.current = { x: touch.clientX, y: touch.clientY }
        isPanningRef.current = false
      }
    }
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastDistanceRef.current !== null) {
        const newDist = getTouchDistance(e.touches)
        const ratio = newDist / lastDistanceRef.current
        const newScale = Math.min(maxScale, Math.max(minScale, baseScaleRef.current * ratio))
        scaleRef.current = newScale
        setScale(newScale)
        const clamped = clampPan(panXRef.current, panYRef.current, newScale)
        panXRef.current = clamped.x
        panYRef.current = clamped.y
        setPanX(clamped.x)
        setPanY(clamped.y)
      } else if (e.touches.length === 1 && scaleRef.current > 1 && lastPanPosRef.current) {
        const touch = e.touches[0]
        if (!touch) {
          return
        }
        const dx = touch.clientX - lastPanPosRef.current.x
        const dy = touch.clientY - lastPanPosRef.current.y
        // Always advance the reference point, even before panning is confirmed.
        // This means if one touchmove is swallowed by a child's stopPropagation
        // (e.g. the swipe-to-flag event), the NEXT event's delta is still
        // accurate — avoiding a position jump from the stale start position.
        lastPanPosRef.current = { x: touch.clientX, y: touch.clientY }
        if (
          !isPanningRef.current &&
          (Math.abs(dx) > PAN_THRESHOLD || Math.abs(dy) > PAN_THRESHOLD)
        ) {
          isPanningRef.current = true
        }
        if (isPanningRef.current) {
          const clamped = clampPan(panXRef.current + dx, panYRef.current + dy, scaleRef.current)
          panXRef.current = clamped.x
          panYRef.current = clamped.y
          setPanX(clamped.x)
          setPanY(clamped.y)
        }
      }
    },
    [minScale, maxScale, clampPan]
  )

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastDistanceRef.current = null
    }
    if (e.touches.length === 0) {
      lastPanPosRef.current = null
      isPanningRef.current = false
    }
  }, [])

  const resetZoom = useCallback(() => {
    scaleRef.current = 1
    setScale(1)
    panXRef.current = 0
    panYRef.current = 0
    setPanX(0)
    setPanY(0)
  }, [])

  return { scale, panX, panY, handlers: { onTouchStart, onTouchMove, onTouchEnd }, resetZoom }
}
