import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onTap: () => void
  delay?: number
}

export function useLongPress({ onLongPress, onTap, delay = 650 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)
  const movedRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const pressStartTimeRef = useRef<number | null>(null)
  const isTouchRef = useRef(false)

  // Presses held longer than this threshold are treated as flag attempts,
  // not taps — so releasing between TAP_MAX_DURATION and `delay` won't reveal a cell.
  const TAP_MAX_DURATION = 200

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isTouchRef.current = true
      longPressTriggeredRef.current = false
      movedRef.current = false
      pressStartTimeRef.current = Date.now()
      const touch = e.touches[0]
      startPosRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null
      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true
        onLongPress()
      }, delay)
    },
    [delay, onLongPress]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) {
        return
      }
      const touch = e.touches[0]
      if (!touch) {
        return
      }
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      if (dx > 10 || dy > 10) {
        clearTimer()
        movedRef.current = true
      }
    },
    [clearTimer]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearTimer()
      const pressDuration = Date.now() - (pressStartTimeRef.current ?? 0)
      if (!longPressTriggeredRef.current && !movedRef.current && pressDuration < TAP_MAX_DURATION) {
        e.preventDefault()
        onTap()
      }
      longPressTriggeredRef.current = false
      movedRef.current = false
      pressStartTimeRef.current = null
    },
    [clearTimer, onTap]
  )

  const onClick = useCallback(
    (_e: React.MouseEvent) => {
      if (isTouchRef.current) {
        isTouchRef.current = false
        return
      }
      onTap()
    },
    [onTap]
  )

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!isTouchRef.current) {
        onLongPress()
      }
    },
    [onLongPress]
  )

  return { onTouchStart, onTouchMove, onTouchEnd, onClick, onContextMenu }
}
