export const HEADER_HEIGHT = 72 // px — portrait: top header (outer padding + inner padding + button + buffer)
export const HEADER_SIDEBAR_WIDTH = 72 // px — landscape: left sidebar width
export const BOARD_PADDING = 16 // px on each side

export function calcCellSize(rows: number, cols: number): number {
  const isLandscape = window.innerWidth > window.innerHeight
  const availW = window.innerWidth - BOARD_PADDING * 2 - (isLandscape ? HEADER_SIDEBAR_WIDTH : 0)
  const availH = window.innerHeight - BOARD_PADDING * 2 - (isLandscape ? 0 : HEADER_HEIGHT)
  const fromWidth = Math.floor(availW / cols)
  const fromHeight = Math.floor(availH / rows)
  return Math.max(12, Math.min(fromWidth, fromHeight))
}
