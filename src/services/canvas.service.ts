import {
  CELL_BORDER_WIDTH_RATIO,
  CELL_FONT_SCALE_ICON,
  CELL_FONT_SCALE_NUMBER,
  CELL_FONT_SCALE_QUESTION,
} from '@/constants/ui.constants';
import type { Board, CellState } from '@/types/game.types';

const NUMBER_COLORS = [
  '',
  '--color-n1',
  '--color-n2',
  '--color-n3',
  '--color-n4',
  '--color-n5',
  '--color-n6',
  '--color-n7',
  '--color-n8',
];

// ─── CSS variable cache ─────────────────────────────────────────────────────
// Reading getComputedStyle every frame is expensive. We cache the resolved
// values and invalidate whenever the theme changes (detected via
// MutationObserver on <body>'s data-theme attribute).

let cssVarCache: Map<string, string> | null = null;
let themeObserver: MutationObserver | null = null;

function invalidateCSSVarCache(): void {
  cssVarCache = null;
}

function ensureThemeObserver(): void {
  if (themeObserver || typeof MutationObserver === 'undefined') {
    return;
  }
  themeObserver = new MutationObserver(invalidateCSSVarCache);
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  });
}

function getCSSVar(name: string): string {
  ensureThemeObserver();
  if (!cssVarCache) {
    cssVarCache = new Map();
  }
  let value = cssVarCache.get(name);
  if (value === undefined) {
    value = getComputedStyle(document.body).getPropertyValue(name).trim();
    cssVarCache.set(name, value);
  }
  return value;
}

interface DrawColors {
  surface: string;
  borderLight: string;
  borderDark: string;
  revealed: string;
  exploded: string;
  numberColors: string[];
  text: string;
  focusRing: string;
  hoverBg: string;
  hoverRing: string;
}

export interface DrawOptions {
  board: Board;
  cellSize: number;
  scale: number;
  panX: number;
  panY: number;
  focusedCell: [number, number] | null;
  hoveredCell: [number, number] | null;
  isGameOver: boolean;
  mineRevealLookup: Map<string, number>;
  chordRippleLookup: Map<string, number>;
  animationsEnabled: boolean;
  animTime: number;
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: CellState,
  x: number,
  y: number,
  size: number,
  isFocused: boolean,
  isHovered: boolean,
  colors: DrawColors
): void {
  const borderW = Math.max(1, Math.round(size * CELL_BORDER_WIDTH_RATIO));

  if (!cell.isRevealed) {
    // Raised cell — flat fill with subtle border
    ctx.fillStyle = isHovered ? colors.hoverBg : colors.surface;
    ctx.fillRect(x, y, size, size);

    // Subtle border (or hover ring)
    if (isHovered) {
      ctx.strokeStyle = colors.hoverRing;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, size - 1.5, size - 1.5);
    } else {
      ctx.strokeStyle = colors.borderLight;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);
    }

    // Content
    if (cell.isFlagged) {
      const emojiSize = Math.floor(size * CELL_FONT_SCALE_ICON);
      ctx.font = `${emojiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Emoji glyphs sit slightly above visual centre; nudge down ~8% of font size
      ctx.fillText('\uD83D\uDEA9', x + size / 2, y + size / 2 + emojiSize * 0.08);
    } else if (cell.isQuestionMark) {
      ctx.font = `bold ${Math.floor(size * CELL_FONT_SCALE_QUESTION)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colors.text;
      ctx.fillText('?', x + size / 2, y + size / 2);
    }
  } else {
    // Revealed cell
    const bg = cell.isExploded ? colors.exploded : colors.revealed;
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, size, size);

    if (cell.hasMine) {
      const emojiSize = Math.floor(size * CELL_FONT_SCALE_ICON);
      ctx.font = `${emojiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Emoji glyphs sit slightly above visual centre; nudge down ~8% of font size
      ctx.fillText('\uD83D\uDCA3', x + size / 2, y + size / 2 + emojiSize * 0.08);
    } else if (cell.value > 0) {
      const colorVar = NUMBER_COLORS[cell.value];
      ctx.fillStyle = colorVar ? getCSSVar(colorVar) : colors.text;
      ctx.font = `bold ${Math.floor(size * CELL_FONT_SCALE_NUMBER)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(cell.value), x + size / 2, y + size / 2);
    }
  }

  // Focus ring
  if (isFocused) {
    ctx.strokeStyle = colors.focusRing;
    ctx.lineWidth = Math.max(2, borderW);
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  }
}

export function drawBoard(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: DrawOptions
): void {
  const { board, cellSize, scale, panX, panY } = options;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  // Colors (read once per frame)
  const surface = getCSSVar('--color-surface');
  const borderLight = getCSSVar('--color-border-light');
  const borderDark = getCSSVar('--color-border-dark');
  const text = getCSSVar('--color-text');
  const revealed = surface;
  const exploded = '#cc0000';
  const focusRing = getCSSVar('--color-accent') || '#0078d4';
  const hoverBg = getCSSVar('--color-cell-hover-bg') || surface;
  const hoverRing = getCSSVar('--color-cell-hover-ring') || 'transparent';
  const numberColors = NUMBER_COLORS.map((v) => (v ? getCSSVar(v) : ''));

  const colors: DrawColors = {
    surface,
    borderLight,
    borderDark,
    revealed,
    exploded,
    numberColors,
    text,
    focusRing,
    hoverBg,
    hoverRing,
  };

  ctx.clearRect(0, 0, w, h);

  const cols = board[0]?.length ?? 0;
  const rows = board.length;
  const boardW = cellSize * cols;
  const boardH = cellSize * rows;
  const cx = boardW / 2;
  const cy = boardH / 2;

  ctx.save();
  ctx.translate(cx + panX, cy + panY);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  for (let r = 0; r < board.length; r++) {
    const row = board[r];
    if (!row) {
      continue;
    }
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) {
        continue;
      }
      const x = c * cellSize;
      const y = r * cellSize;
      const isFocused =
        options.focusedCell !== null &&
        options.focusedCell[0] === r &&
        options.focusedCell[1] === c;
      const isHovered =
        !options.isGameOver &&
        options.hoveredCell !== null &&
        options.hoveredCell[0] === r &&
        options.hoveredCell[1] === c &&
        !cell.isRevealed;
      drawCell(ctx, cell, x, y, cellSize, isFocused, isHovered, colors);
    }
  }

  ctx.restore();
}

export function hitTestCell(
  canvasX: number,
  canvasY: number,
  cellSize: number,
  cols: number,
  rows: number,
  boardWidth: number,
  boardHeight: number,
  scale: number,
  panX: number,
  panY: number
): [number, number] | null {
  const cx = boardWidth / 2;
  const cy = boardHeight / 2;

  const boardX = (canvasX - cx - panX) / scale + cx;
  const boardY = (canvasY - cy - panY) / scale + cy;

  const col = Math.floor(boardX / cellSize);
  const row = Math.floor(boardY / cellSize);

  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return null;
  }

  return [row, col];
}
