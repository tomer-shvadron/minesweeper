export const HEADER_HEIGHT = 48 // px — reserved for the game header
export const BOARD_PADDING = 16 // px on each side

/**
 * Computes the largest cell size (in px) that fits the entire board
 * within the available viewport area.
 *
 * Never returns less than 12px (functional on very large custom boards).
 */
export function calcCellSize(rows: number, cols: number): number {
  const availW = window.innerWidth - BOARD_PADDING * 2
  const availH = window.innerHeight - HEADER_HEIGHT - BOARD_PADDING * 2
  const fromWidth = Math.floor(availW / cols)
  const fromHeight = Math.floor(availH / rows)
  return Math.max(12, Math.min(fromWidth, fromHeight))
}
