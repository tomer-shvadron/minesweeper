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
  const swipeFlaggedRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const pressStartTimeRef = useRef<number | null>(null)
  const isTouchRef = useRef(false)

  const TAP_MAX_DURATION = 200
  const SWIPE_DOWN_THRESHOLD = 20 // px downward to trigger swipe-to-flag
  const SWIPE_TIME_WINDOW = 350 // ms — generous window accounts for iOS touch event coalescing

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Prevent iOS from holding off touchmove events while it decides
      // whether the gesture is a tap, scroll, or custom action.
      // With touch-action: none on .cell, this ensures all move events
      // are delivered to our handler immediately.
      e.preventDefault()
      isTouchRef.current = true
      longPressTriggeredRef.current = false
      movedRef.current = false
      swipeFlaggedRef.current = false
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
      const dy = touch.clientY - startPosRef.current.y // signed: positive = downward

      // A quick downward swipe within the time window fires flag immediately,
      // without waiting for the long-press timer.
      const elapsed = Date.now() - (pressStartTimeRef.current ?? 0)
      if (dy >= SWIPE_DOWN_THRESHOLD && elapsed < SWIPE_TIME_WINDOW && !swipeFlaggedRef.current) {
        clearTimer()
        swipeFlaggedRef.current = true
        movedRef.current = true
        onLongPress()
        // Stop propagation ONLY on this one event so the board's pinch-zoom
        // handler doesn't receive the same impulse and start panning.
        // We do NOT suppress subsequent events — those must reach the pan
        // handler so the user can still pan the board after flagging.
        e.stopPropagation()
        return
      }

      if (dx > 10 || Math.abs(dy) > 10) {
        clearTimer()
        movedRef.current = true
      }
    },
    [clearTimer, onLongPress]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearTimer()
      const pressDuration = Date.now() - (pressStartTimeRef.current ?? 0)

      // Fallback swipe-to-flag: if touchmove didn't fire reliably (iOS coalescing),
      // check total displacement at lift. If the finger moved ≥ SWIPE_DOWN_THRESHOLD
      // downward and long-press hasn't already fired, treat it as a swipe flag.
      if (!swipeFlaggedRef.current && !longPressTriggeredRef.current && startPosRef.current) {
        const changedTouch = e.changedTouches?.[0]
        if (changedTouch) {
          const totalDy = changedTouch.clientY - startPosRef.current.y
          if (totalDy >= SWIPE_DOWN_THRESHOLD) {
            onLongPress()
            longPressTriggeredRef.current = false
            movedRef.current = false
            swipeFlaggedRef.current = false
            pressStartTimeRef.current = null
            startPosRef.current = null
            return
          }
        }
      }

      if (
        !longPressTriggeredRef.current &&
        !movedRef.current &&
        !swipeFlaggedRef.current &&
        pressDuration < TAP_MAX_DURATION
      ) {
        e.preventDefault()
        onTap()
      }
      longPressTriggeredRef.current = false
      movedRef.current = false
      swipeFlaggedRef.current = false
      pressStartTimeRef.current = null
      startPosRef.current = null
    },
    [clearTimer, onLongPress, onTap]
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
