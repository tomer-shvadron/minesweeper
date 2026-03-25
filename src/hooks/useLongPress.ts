import { useCallback, useRef } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onTap: () => void
  delay?: number
}

/**
 * Unified long-press / tap handler for both touch (mobile) and mouse (desktop).
 * - Touch: tap = onTap, long-press = onLongPress
 * - Mouse: click = onTap, right-click (contextmenu) = onLongPress
 */
export function useLongPress({ onLongPress, onTap, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const isTouchRef = useRef(false)

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
      if (!startPosRef.current) return
      const touch = e.touches[0]
      if (!touch) return
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      if (dx > 10 || dy > 10) clearTimer()
    },
    [clearTimer]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearTimer()
      if (!longPressTriggeredRef.current) {
        e.preventDefault() // prevent ghost click on mobile
        onTap()
      }
      longPressTriggeredRef.current = false
    },
    [clearTimer, onTap]
  )

  const onClick = useCallback(
    (_e: React.MouseEvent) => {
      // Ignore click if this interaction started as a touch (already handled by onTouchEnd)
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
      if (!isTouchRef.current) onLongPress()
    },
    [onLongPress]
  )

  return { onTouchStart, onTouchMove, onTouchEnd, onClick, onContextMenu }
}
