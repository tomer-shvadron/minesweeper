import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePinchZoom } from '@/hooks/usePinchZoom';

function oneFingerEvent(x: number, y: number) {
  return {
    touches: [{ clientX: x, clientY: y }],
    preventDefault: vi.fn(),
  } as unknown as React.TouchEvent;
}

function twoFingerEvent(x1: number, y1: number, x2: number, y2: number) {
  return {
    touches: [
      { clientX: x1, clientY: y1 },
      { clientX: x2, clientY: y2 },
    ],
    preventDefault: vi.fn(),
  } as unknown as React.TouchEvent;
}

function noFingerEvent() {
  return { touches: [] } as unknown as React.TouchEvent;
}

describe('usePinchZoom', () => {
  // ----------------------------------------------------------------
  describe('initial state', () => {
    it('starts at scale 1 with no pan', () => {
      const { result } = renderHook(() => usePinchZoom());
      expect(result.current.scale).toBe(1);
      expect(result.current.panX).toBe(0);
      expect(result.current.panY).toBe(0);
    });
  });

  // ----------------------------------------------------------------
  describe('pinch zoom', () => {
    it('increases scale when fingers spread apart', () => {
      const { result } = renderHook(() => usePinchZoom(1, 5, 300, 400));

      act(() => result.current.handlers.onTouchStart(twoFingerEvent(0, 0, 100, 0)));
      act(() => result.current.handlers.onTouchMove(twoFingerEvent(0, 0, 200, 0)));

      expect(result.current.scale).toBeCloseTo(2);
    });

    it('decreases scale when fingers pinch together', () => {
      const { result } = renderHook(() => usePinchZoom(1, 5, 300, 400));

      // First zoom to 2x
      act(() => result.current.handlers.onTouchStart(twoFingerEvent(0, 0, 200, 0)));
      act(() => result.current.handlers.onTouchMove(twoFingerEvent(0, 0, 400, 0)));
      // Now pinch back
      act(() => result.current.handlers.onTouchEnd(noFingerEvent()));
      act(() => result.current.handlers.onTouchStart(twoFingerEvent(0, 0, 200, 0)));
      act(() => result.current.handlers.onTouchMove(twoFingerEvent(0, 0, 100, 0)));

      expect(result.current.scale).toBeCloseTo(1);
    });

    it('clamps scale to maxScale', () => {
      const { result } = renderHook(() => usePinchZoom(1, 3, 300, 400));

      act(() => result.current.handlers.onTouchStart(twoFingerEvent(0, 0, 10, 0)));
      act(() => result.current.handlers.onTouchMove(twoFingerEvent(0, 0, 1000, 0)));

      expect(result.current.scale).toBe(3);
    });

    it('clamps scale to minScale', () => {
      const { result } = renderHook(() => usePinchZoom(1, 5, 300, 400));

      act(() => result.current.handlers.onTouchStart(twoFingerEvent(0, 0, 200, 0)));
      act(() => result.current.handlers.onTouchMove(twoFingerEvent(0, 0, 1, 0)));

      expect(result.current.scale).toBe(1);
    });
  });

  // ----------------------------------------------------------------
  describe('single-finger pan (requires scale > 1)', () => {
    async function zoomTo2x() {
      const hook = renderHook(() => usePinchZoom(1, 5, 300, 400));
      act(() => hook.result.current.handlers.onTouchStart(twoFingerEvent(0, 0, 100, 0)));
      act(() => hook.result.current.handlers.onTouchMove(twoFingerEvent(0, 0, 200, 0)));
      act(() => hook.result.current.handlers.onTouchEnd(noFingerEvent()));
      return hook;
    }

    it('pans right when single finger moves right past threshold', async () => {
      const hook = await zoomTo2x();
      act(() => hook.result.current.handlers.onTouchStart(oneFingerEvent(100, 100)));
      act(() => hook.result.current.handlers.onTouchMove(oneFingerEvent(115, 100))); // 15px > threshold

      expect(hook.result.current.panX).toBeGreaterThan(0);
    });

    it('pans down when single finger moves down past threshold', async () => {
      const hook = await zoomTo2x();
      act(() => hook.result.current.handlers.onTouchStart(oneFingerEvent(100, 100)));
      act(() => hook.result.current.handlers.onTouchMove(oneFingerEvent(100, 120)));

      expect(hook.result.current.panY).toBeGreaterThan(0);
    });

    it('does not pan when movement is below the 10px threshold', async () => {
      const hook = await zoomTo2x();
      act(() => hook.result.current.handlers.onTouchStart(oneFingerEvent(100, 100)));
      act(() => hook.result.current.handlers.onTouchMove(oneFingerEvent(109, 100))); // 9px — below threshold

      expect(hook.result.current.panX).toBe(0);
    });

    it('does not pan when scale is 1', () => {
      const { result } = renderHook(() => usePinchZoom(1, 5, 300, 400));

      act(() => result.current.handlers.onTouchStart(oneFingerEvent(0, 0)));
      act(() => result.current.handlers.onTouchMove(oneFingerEvent(50, 0)));

      expect(result.current.panX).toBe(0);
    });

    it('clamps panX so board never scrolls past its edges', async () => {
      const hook = await zoomTo2x();
      // At scale=2 and boardWidth=300, max panX = (300/2) * (2-1) = 150
      act(() => hook.result.current.handlers.onTouchStart(oneFingerEvent(100, 0)));
      act(() => hook.result.current.handlers.onTouchMove(oneFingerEvent(1000, 0))); // huge move

      expect(hook.result.current.panX).toBeLessThanOrEqual(150);
      expect(hook.result.current.panX).toBe(150); // should be exactly at max
    });

    it('clamps panX in the negative direction', async () => {
      const hook = await zoomTo2x();
      act(() => hook.result.current.handlers.onTouchStart(oneFingerEvent(100, 0)));
      act(() => hook.result.current.handlers.onTouchMove(oneFingerEvent(-1000, 0)));

      expect(hook.result.current.panX).toBeGreaterThanOrEqual(-150);
      expect(hook.result.current.panX).toBe(-150); // should be exactly at min
    });

    it('resets isPanning state on touch end so the next touch starts fresh', async () => {
      const hook = await zoomTo2x();
      // Pan right
      act(() => hook.result.current.handlers.onTouchStart(oneFingerEvent(0, 0)));
      act(() => hook.result.current.handlers.onTouchMove(oneFingerEvent(20, 0)));
      act(() => hook.result.current.handlers.onTouchEnd(noFingerEvent()));
      const panAfterFirst = hook.result.current.panX;

      // Pan right again from new position
      act(() => hook.result.current.handlers.onTouchStart(oneFingerEvent(0, 0)));
      act(() => hook.result.current.handlers.onTouchMove(oneFingerEvent(20, 0)));

      expect(hook.result.current.panX).toBeGreaterThanOrEqual(panAfterFirst);
    });
  });

  // ----------------------------------------------------------------
  describe('resetZoom', () => {
    it('resets scale to 1 and pan to (0, 0)', async () => {
      const { result } = renderHook(() => usePinchZoom(1, 5, 300, 400));

      act(() => result.current.handlers.onTouchStart(twoFingerEvent(0, 0, 100, 0)));
      act(() => result.current.handlers.onTouchMove(twoFingerEvent(0, 0, 300, 0)));
      act(() => result.current.resetZoom());

      expect(result.current.scale).toBe(1);
      expect(result.current.panX).toBe(0);
      expect(result.current.panY).toBe(0);
    });

    it('clamps pan to 0 after resetZoom brings scale back to 1', () => {
      const { result } = renderHook(() => usePinchZoom(1, 5, 300, 400));
      act(() => result.current.resetZoom());
      expect(result.current.panX).toBe(0);
      expect(result.current.panY).toBe(0);
    });
  });
});
