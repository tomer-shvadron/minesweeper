export const HEADER_HEIGHT = 72 // px — game header: outer padding (16) + inner padding (12) + button height (38) + buffer
export const BOARD_PADDING = 16 // px on each side

export function calcCellSize(rows: number, cols: number): number {
  const availW = window.innerWidth - BOARD_PADDING * 2
  const availH = window.innerHeight - HEADER_HEIGHT - BOARD_PADDING * 2
  const fromWidth = Math.floor(availW / cols)
  const fromHeight = Math.floor(availH / rows)
  return Math.max(12, Math.min(fromWidth, fromHeight))
}
