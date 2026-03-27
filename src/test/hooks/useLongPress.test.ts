import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLongPress } from '@/hooks/useLongPress';

function touchEvent(x = 0, y = 0) {
  return {
    touches: [{ clientX: x, clientY: y }],
    preventDefault: vi.fn(),
  } as unknown as React.TouchEvent;
}

function mouseEvent() {
  return {} as unknown as React.MouseEvent;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLongPress', () => {
  // ----------------------------------------------------------------
  describe('touch — tap (short press)', () => {
    it('calls onTap when the finger is released before the delay', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap, onLongPress, delay: 500 }));

      act(() => result.current.onTouchStart(touchEvent()));
      act(() => result.current.onTouchEnd(touchEvent()));

      expect(onTap).toHaveBeenCalledOnce();
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('does not call onTap when the long-press timer has already fired', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap, onLongPress, delay: 500 }));

      act(() => result.current.onTouchStart(touchEvent()));
      act(() => vi.advanceTimersByTime(500));
      act(() => result.current.onTouchEnd(touchEvent()));

      expect(onTap).not.toHaveBeenCalled();
      expect(onLongPress).toHaveBeenCalledOnce();
    });
  });

  // ----------------------------------------------------------------
  describe('touch — long press', () => {
    it('calls onLongPress after the delay elapses', () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap: vi.fn(), onLongPress, delay: 500 })
      );

      act(() => result.current.onTouchStart(touchEvent()));
      act(() => vi.advanceTimersByTime(500));

      expect(onLongPress).toHaveBeenCalledOnce();
    });

    it('does not fire onLongPress before the delay elapses', () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap: vi.fn(), onLongPress, delay: 500 })
      );

      act(() => result.current.onTouchStart(touchEvent()));
      act(() => vi.advanceTimersByTime(499));

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('uses the default delay of 650ms', () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap: vi.fn(), onLongPress }));

      act(() => result.current.onTouchStart(touchEvent()));
      act(() => vi.advanceTimersByTime(649));
      expect(onLongPress).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(1));
      expect(onLongPress).toHaveBeenCalledOnce();
    });
  });

  // ----------------------------------------------------------------
  describe('touch — duration guard (aborted flag attempt)', () => {
    it('does not call onTap when press is held longer than 200ms but released before long-press fires', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap, onLongPress, delay: 500 }));

      act(() => result.current.onTouchStart(touchEvent()));
      // Simulate holding for 300ms — too long for a tap, too short for long-press
      act(() => vi.advanceTimersByTime(300));
      act(() => result.current.onTouchEnd(touchEvent()));

      expect(onTap).not.toHaveBeenCalled();
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('calls onTap when press is released within 200ms', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap, onLongPress: vi.fn(), delay: 500 })
      );

      act(() => result.current.onTouchStart(touchEvent()));
      act(() => vi.advanceTimersByTime(199));
      act(() => result.current.onTouchEnd(touchEvent()));

      expect(onTap).toHaveBeenCalledOnce();
    });
  });

  // ----------------------------------------------------------------
  describe('touch — movement cancels both long-press and tap', () => {
    it('cancels the long-press timer when finger moves more than 10px', () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap: vi.fn(), onLongPress, delay: 500 })
      );

      act(() => result.current.onTouchStart(touchEvent(0, 0)));
      act(() => result.current.onTouchMove(touchEvent(11, 0))); // moved 11px
      act(() => vi.advanceTimersByTime(500));

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('does not call onTap when finger moved more than 10px before release', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap, onLongPress: vi.fn(), delay: 500 })
      );

      act(() => result.current.onTouchStart(touchEvent(0, 0)));
      act(() => result.current.onTouchMove(touchEvent(15, 0))); // scroll
      act(() => result.current.onTouchEnd(touchEvent()));

      expect(onTap).not.toHaveBeenCalled();
    });

    it('does not cancel when movement is within 10px threshold', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap, onLongPress: vi.fn(), delay: 500 })
      );

      act(() => result.current.onTouchStart(touchEvent(0, 0)));
      act(() => result.current.onTouchMove(touchEvent(9, 0))); // within threshold
      act(() => result.current.onTouchEnd(touchEvent()));

      expect(onTap).toHaveBeenCalledOnce();
    });

    it('detects movement on the Y axis too', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap, onLongPress: vi.fn(), delay: 500 })
      );

      act(() => result.current.onTouchStart(touchEvent(0, 0)));
      act(() => result.current.onTouchMove(touchEvent(0, 11))); // vertical scroll
      act(() => result.current.onTouchEnd(touchEvent()));

      expect(onTap).not.toHaveBeenCalled();
    });

    it('resets movement flag between separate touch sequences', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() =>
        useLongPress({ onTap, onLongPress: vi.fn(), delay: 500 })
      );

      // First interaction: scroll → no tap
      act(() => result.current.onTouchStart(touchEvent(0, 0)));
      act(() => result.current.onTouchMove(touchEvent(20, 0)));
      act(() => result.current.onTouchEnd(touchEvent()));
      expect(onTap).not.toHaveBeenCalled();

      // Second interaction: clean tap → should fire
      act(() => result.current.onTouchStart(touchEvent(0, 0)));
      act(() => result.current.onTouchEnd(touchEvent()));
      expect(onTap).toHaveBeenCalledOnce();
    });
  });

  // ----------------------------------------------------------------
  describe('desktop — click and right-click', () => {
    it('calls onTap on a regular mouse click', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap, onLongPress: vi.fn() }));

      act(() => result.current.onClick(mouseEvent()));

      expect(onTap).toHaveBeenCalledOnce();
    });

    it('calls onLongPress on right-click (contextmenu)', () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap: vi.fn(), onLongPress }));

      const e = { preventDefault: vi.fn() } as unknown as React.MouseEvent;
      act(() => result.current.onContextMenu(e));

      expect(onLongPress).toHaveBeenCalledOnce();
      expect(e.preventDefault).toHaveBeenCalled();
    });

    it('suppresses the onClick after a touch interaction (no ghost click)', () => {
      const onTap = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap, onLongPress: vi.fn() }));

      act(() => result.current.onTouchStart(touchEvent()));
      act(() => result.current.onTouchEnd(touchEvent()));
      act(() => result.current.onClick(mouseEvent()));

      // onTap fired once by onTouchEnd; the onClick should be suppressed
      expect(onTap).toHaveBeenCalledOnce();
    });

    it('does not call onLongPress from contextmenu when a touch was in progress', () => {
      const onLongPress = vi.fn();
      const { result } = renderHook(() => useLongPress({ onTap: vi.fn(), onLongPress }));

      act(() => result.current.onTouchStart(touchEvent()));
      const e = { preventDefault: vi.fn() } as unknown as React.MouseEvent;
      act(() => result.current.onContextMenu(e));

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });
});
