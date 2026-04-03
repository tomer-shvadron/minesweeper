import { useCallback, useState, type ReactNode } from 'react';

interface StableHeightProps {
  children: ReactNode;
  /**
   * When true, also caps max-height at the initial value and enables
   * overflow scrolling for content that exceeds it.
   */
  clamp?: boolean;
}

/**
 * Captures the height of its children on first render and locks it as
 * `min-height` (so shorter content doesn't shrink the parent).
 *
 * With `clamp`, it also sets `max-height` and adds `overflow-y: auto` so
 * content that exceeds the locked height scrolls in place.
 */
export const StableHeight = ({ children, clamp = false }: StableHeightProps) => {
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && lockedHeight === null) {
        setLockedHeight(node.scrollHeight);
      }
    },
    [lockedHeight]
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
