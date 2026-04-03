import type { BoardSize, CellStyle, LayoutMode } from '@/types/settings.types';

export const NAV_BAR_HEIGHT = 64; // px — mobile portrait: bottom nav bar
export const BOARD_PADDING = 16; // px on each side
export const FLOATING_PILLS_HEIGHT = 48; // px — space reserved above board for pills
/** @deprecated Game over is now an overlay card — no space reservation needed. Kept for test compatibility. */
export const GAME_OVER_BANNER_HEIGHT = 0;
export const CELL_GAP_ROUNDED = 3; // px gap between cells in rounded cell style

export const DESKTOP_TOP_BAR_HEIGHT = 52; // px — desktop top toolbar
export const MOBILE_LANDSCAPE_TOP_BAR_HEIGHT = 44; // px — mobile landscape compact bar
export const DESKTOP_MIN_WIDTH = 600; // px — minimum viewport width for desktop mode

/** Max cell size per board-size setting. [desktop, mobile] */
const MAX_CELL: Record<BoardSize, [number, number]> = {
  small: [48, 52],
  medium: [72, 72],
  large: [100, 100],
};

/** Detect desktop via fine pointer (mouse) — coarse = touch device. */
function isDesktop(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia?.('(pointer: fine)').matches;
}

/** Determine the current layout mode from viewport + pointer. */
export function getLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') {
    return 'mobile-portrait';
  }

  const hasFinePointer = isDesktop();
  const isWideEnough = window.innerWidth >= DESKTOP_MIN_WIDTH;

  if (hasFinePointer && isWideEnough) {
    return 'desktop';
  }

  const isLandscape = window.innerWidth > window.innerHeight;
  return isLandscape ? 'mobile-landscape' : 'mobile-portrait';
}

export function calcCellSize(
  rows: number,
  cols: number,
  boardSize: BoardSize = 'medium',
  cellStyle: CellStyle = 'rounded'
): number {
  const layoutMode = getLayoutMode();
  const gap = cellStyle === 'rounded' ? CELL_GAP_ROUNDED : 0;

  // Width: no side nav in any mode
  const availW = window.innerWidth - BOARD_PADDING * 2 - gap * (cols - 1);

  // Height: deductions depend on layout mode
  let topDeduction = 0;
  let bottomDeduction = 0;
  let pillsDeduction = 0;

  switch (layoutMode) {
    case 'desktop':
      topDeduction = DESKTOP_TOP_BAR_HEIGHT;
      break;
    case 'mobile-landscape':
      topDeduction = MOBILE_LANDSCAPE_TOP_BAR_HEIGHT;
      break;
    case 'mobile-portrait':
      bottomDeduction = NAV_BAR_HEIGHT;
      pillsDeduction = FLOATING_PILLS_HEIGHT;
      break;
  }

  const availH =
    window.innerHeight -
    BOARD_PADDING * 2 -
    topDeduction -
    bottomDeduction -
    pillsDeduction -
    GAME_OVER_BANNER_HEIGHT -
    gap * (rows - 1);

  const fromWidth = Math.floor(availW / cols);
  const fromHeight = Math.floor(availH / rows);
  const natural = Math.min(fromWidth, fromHeight);

  const [desktopMax, mobileMax] = MAX_CELL[boardSize];
  const maxCell = isDesktop() ? desktopMax : mobileMax;
  return Math.max(12, Math.min(natural, maxCell));
}
