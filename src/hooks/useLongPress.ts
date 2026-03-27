import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onTap: () => void;
  delay?: number;
}

export function useLongPress({ onLongPress, onTap, delay = 650 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const movedRef = useRef(false);
  const swipeFlaggedRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const pressStartTimeRef = useRef<number | null>(null);
  const isTouchRef = useRef(false);
  // Set whenever 2+ fingers are active; prevents swipe-to-flag and long-press
  // from firing during pinch-to-zoom gestures.
  const multiTouchRef = useRef(false);

  // ── Swipe-to-flag gesture state machine ──────────────────────────────────
  // Option A: tight 150 ms recognition window — fast flicks qualify, slow
  //           pan ramp-ups don't reach the threshold in time.
  // Option D: 80 ms commit delay — once the threshold is crossed we wait a
  //           beat; if the finger keeps moving (pan) we cancel, if it slows
  //           or lifts (flag flick) we commit.
  const SWIPE_DOWN_THRESHOLD = 20; // px downward to start evaluation
  const SWIPE_TIME_WINDOW = 150; // ms from touch-start within which threshold must be crossed
  const SWIPE_COMMIT_DELAY = 80; // ms to wait before committing the flag
  const SWIPE_CANCEL_MOVE = 12; // px of additional travel during commit window → cancel
  const TAP_MAX_DURATION = 200;

  const swipePendingRef = useRef(false); // threshold crossed, commit timer running
  const swipeThresholdPosRef = useRef<{ x: number; y: number } | null>(null);
  const swipeCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearSwipeCommitTimer = useCallback(() => {
    if (swipeCommitTimerRef.current) {
      clearTimeout(swipeCommitTimerRef.current);
      swipeCommitTimerRef.current = null;
    }
  }, []);

  const commitFlag = useCallback(() => {
    swipePendingRef.current = false;
    swipeThresholdPosRef.current = null;
    swipeFlaggedRef.current = true;
    onLongPress();
  }, [onLongPress]);

  const resetSwipeState = useCallback(() => {
    clearSwipeCommitTimer();
    swipePendingRef.current = false;
    swipeThresholdPosRef.current = null;
  }, [clearSwipeCommitTimer]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Prevent iOS from holding off touchmove events while it decides
      // whether the gesture is a tap, scroll, or custom action.
      e.preventDefault();
      isTouchRef.current = true;

      // A second finger landed — this is a pinch-to-zoom, not a cell gesture.
      // Abort any pending long-press or swipe and lock out further processing
      // until the gesture fully ends and a fresh single-touch starts.
      if (e.touches.length > 1) {
        multiTouchRef.current = true;
        clearTimer();
        resetSwipeState();
        movedRef.current = true; // prevent tap on subsequent touchend
        return;
      }

      // Fresh single-touch: clear multi-touch lock and start tracking.
      multiTouchRef.current = false;
      longPressTriggeredRef.current = false;
      movedRef.current = false;
      swipeFlaggedRef.current = false;
      resetSwipeState();
      pressStartTimeRef.current = Date.now();
      const touch = e.touches[0];
      startPosRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      timerRef.current = setTimeout(() => {
        longPressTriggeredRef.current = true;
        onLongPress();
      }, delay);
    },
    [delay, onLongPress, clearTimer, resetSwipeState]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      // Multi-touch (pinch) in progress — ignore all single-touch gesture logic.
      if (multiTouchRef.current || e.touches.length > 1) {
        multiTouchRef.current = true;
        clearTimer();
        resetSwipeState();
        movedRef.current = true;
        return;
      }
      if (!startPosRef.current) {
        return;
      }
      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      // ── Commit-window monitoring (Option D) ─────────────────────────────
      // Once the threshold is crossed we watch for additional travel. If the
      // finger moves SWIPE_CANCEL_MOVE px more in any direction the gesture
      // is re-classified as a pan and the pending flag is cancelled.
      // We let these events propagate so the pan handler can take over
      // seamlessly.
      if (swipePendingRef.current && swipeThresholdPosRef.current) {
        const addlDx = Math.abs(touch.clientX - swipeThresholdPosRef.current.x);
        const addlDy = Math.abs(touch.clientY - swipeThresholdPosRef.current.y);
        if (addlDx > SWIPE_CANCEL_MOVE || addlDy > SWIPE_CANCEL_MOVE) {
          // Finger kept moving → pan intent, cancel the pending flag
          resetSwipeState();
          // movedRef is already true; fall through so general movement is tracked
        } else {
          return; // still within commit window, nothing else to do
        }
      }

      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = touch.clientY - startPosRef.current.y; // signed: positive = downward

      // ── Swipe detection (Options A + D) ─────────────────────────────────
      const elapsed = Date.now() - (pressStartTimeRef.current ?? 0);
      if (
        !swipeFlaggedRef.current &&
        !swipePendingRef.current &&
        dy >= SWIPE_DOWN_THRESHOLD &&
        elapsed < SWIPE_TIME_WINDOW
      ) {
        clearTimer();
        movedRef.current = true;
        swipePendingRef.current = true;
        swipeThresholdPosRef.current = { x: touch.clientX, y: touch.clientY };
        // Stop propagation on this one event so the board's pan handler
        // doesn't receive the same impulse and jolt the viewport.
        e.stopPropagation();
        // Start the commit delay — if the finger stays still long enough
        // we treat it as a deliberate flag flick.
        swipeCommitTimerRef.current = setTimeout(() => {
          if (swipePendingRef.current) {
            commitFlag();
          }
        }, SWIPE_COMMIT_DELAY);
        return;
      }

      if (dx > 10 || Math.abs(dy) > 10) {
        clearTimer();
        movedRef.current = true;
      }
    },
    [clearTimer, resetSwipeState, commitFlag]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearTimer();
      clearSwipeCommitTimer();

      // All fingers lifted — reset multi-touch lock so the next tap works.
      if (e.touches.length === 0) {
        multiTouchRef.current = false;
      }

      const pressDuration = Date.now() - (pressStartTimeRef.current ?? 0);

      // If the commit window was open when the finger lifted, confirm the flag.
      // Lifting quickly after the threshold is itself strong evidence of a
      // deliberate flag flick rather than an ongoing pan.
      if (swipePendingRef.current && !longPressTriggeredRef.current) {
        swipePendingRef.current = false;
        swipeThresholdPosRef.current = null;
        swipeFlaggedRef.current = true;
        onLongPress();
        longPressTriggeredRef.current = false;
        movedRef.current = false;
        swipeFlaggedRef.current = false;
        pressStartTimeRef.current = null;
        startPosRef.current = null;
        return;
      }

      // Fallback swipe-to-flag: if touchmove didn't fire reliably (iOS
      // coalescing), check total displacement + time at lift.
      if (!swipeFlaggedRef.current && !longPressTriggeredRef.current && startPosRef.current) {
        const changedTouch = e.changedTouches?.[0];
        if (changedTouch) {
          const totalDy = changedTouch.clientY - startPosRef.current.y;
          if (totalDy >= SWIPE_DOWN_THRESHOLD && pressDuration < SWIPE_TIME_WINDOW) {
            onLongPress();
            longPressTriggeredRef.current = false;
            movedRef.current = false;
            swipeFlaggedRef.current = false;
            pressStartTimeRef.current = null;
            startPosRef.current = null;
            return;
          }
        }
      }

      if (
        !longPressTriggeredRef.current &&
        !movedRef.current &&
        !swipeFlaggedRef.current &&
        pressDuration < TAP_MAX_DURATION
      ) {
        e.preventDefault();
        onTap();
      }
      longPressTriggeredRef.current = false;
      movedRef.current = false;
      swipeFlaggedRef.current = false;
      pressStartTimeRef.current = null;
      startPosRef.current = null;
    },
    [clearTimer, clearSwipeCommitTimer, onLongPress, onTap]
  );

  const onClick = useCallback(
    (_e: React.MouseEvent) => {
      if (isTouchRef.current) {
        isTouchRef.current = false;
        return;
      }
      onTap();
    },
    [onTap]
  );

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isTouchRef.current) {
        onLongPress();
      }
    },
    [onLongPress]
  );

  return { onTouchStart, onTouchMove, onTouchEnd, onClick, onContextMenu };
}
