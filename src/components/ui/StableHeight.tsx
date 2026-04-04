import { useCallback, useState, type ReactNode } from 'react';

interface StableHeightProps {
  children: ReactNode;
  /**
   * When true, also caps max-height at the locked value and enables
   * overflow scrolling for content that exceeds it.
   */
  clamp?: boolean;
  /** Optional floor in px — the locked height will never be less than this. */
  minHeight?: number;
}

/**
 * Captures the height of its children on first render and locks it as
 * `min-height` (so shorter content doesn't shrink the parent).
 *
 * With `clamp`, it also sets `max-height` and adds `overflow-y: auto` so
 * content that exceeds the locked height scrolls in place.
 */
export const StableHeight = ({ children, clamp = false, minHeight }: StableHeightProps) => {
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && lockedHeight === null) {
        const measured = node.scrollHeight;
        setLockedHeight(minHeight ? Math.max(measured, minHeight) : measured);
      }
    },
    [lockedHeight, minHeight]
  );

  const style = lockedHeight
    ? clamp
      ? { minHeight: lockedHeight, maxHeight: lockedHeight }
      : { minHeight: lockedHeight }
    : undefined;

  return (
    <div ref={ref} className={clamp ? 'overflow-y-auto' : undefined} style={style}>
      {children}
    </div>
  );
};
