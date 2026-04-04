/**
 * Default return value for the `useGameLayout` hook in tests.
 *
 * Since `vi.mock` factories are hoisted above imports, this object cannot be
 * imported and used directly in a mock factory. Instead, copy the pattern:
 *
 * ```ts
 * vi.mock('@/hooks/useGameLayout', () => ({
 *   useGameLayout: () => ({ ...DEFAULT_LAYOUT }),
 * }));
 * ```
 *
 * Or use `vi.hoisted` to make it available:
 * ```ts
 * const { DEFAULT_LAYOUT } = vi.hoisted(() => ({
 *   DEFAULT_LAYOUT: { layoutMode: 'mobile-portrait', ... },
 * }));
 * ```
 */
export const DEFAULT_LAYOUT = {
  layoutMode: 'mobile-portrait' as const,
  cellSize: 32,
  boardWidth: 288,
  boardHeight: 288,
  showTopBar: false,
  showBottomNav: true,
  showFloatingPills: true,
  topBarHeight: 0,
  navBarHeight: 64,
  config: { rows: 9, cols: 9, mines: 10 },
};
