import type { Board, CellState } from '@/types/game.types';
import type { CellStyle } from '@/types/settings.types';

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

function getCSSVar(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
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
}

export interface DrawOptions {
  board: Board;
  cellSize: number;
  cellStyle: CellStyle;
  cellGap: number;
  scale: number;
  panX: number;
  panY: number;
  focusedCell: [number, number] | null;
  mineRevealLookup: Map<string, number>;
  chordRippleLookup: Map<string, number>;
  animationsEnabled: boolean;
  animTime: number;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: CellState,
  x: number,
  y: number,
  size: number,
  isFocused: boolean,
  colors: DrawColors,
  radius: number
): void {
  const borderW = Math.max(1, Math.round(size * 0.08));
  const isRounded = radius > 0;

  if (!cell.isRevealed) {
    // Raised cell
    ctx.fillStyle = colors.surface;
    if (isRounded) {
      roundedRect(ctx, x, y, size, size, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, size, size);
      // Top / left highlight
      ctx.fillStyle = colors.borderLight;
      ctx.fillRect(x, y, size, borderW);
      ctx.fillRect(x, y, borderW, size);
      // Bottom / right shadow
      ctx.fillStyle = colors.borderDark;
      ctx.fillRect(x, y + size - borderW, size, borderW);
      ctx.fillRect(x + size - borderW, y, borderW, size);
    }

    if (isRounded) {
      // Subtle border for rounded cells
      ctx.strokeStyle = colors.borderLight;
      ctx.lineWidth = 1;
      roundedRect(ctx, x, y, size, size, radius);
      ctx.stroke();
    }

    // Content
    if (cell.isFlagged) {
      ctx.font = `${Math.floor(size * 0.65)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\uD83D\uDEA9', x + size / 2, y + size / 2);
    } else if (cell.isQuestionMark) {
      ctx.font = `bold ${Math.floor(size * 0.6)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colors.text;
      ctx.fillText('?', x + size / 2, y + size / 2);
    }
  } else {
    // Revealed cell
    const bg = cell.isExploded ? colors.exploded : colors.revealed;
    ctx.fillStyle = bg;
    if (isRounded) {
      roundedRect(ctx, x, y, size, size, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, size, size);
    }

    if (cell.hasMine) {
      ctx.font = `${Math.floor(size * 0.72)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\uD83D\uDCA3', x + size / 2, y + size / 2);
    } else if (cell.value > 0) {
      const colorVar = NUMBER_COLORS[cell.value];
      ctx.fillStyle = colorVar ? getCSSVar(colorVar) : colors.text;
      ctx.font = `bold ${Math.floor(size * 0.65)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(cell.value), x + size / 2, y + size / 2);
    }
  }

  // Focus ring
  if (isFocused) {
    ctx.strokeStyle = colors.focusRing;
    ctx.lineWidth = Math.max(2, borderW);
    if (isRounded) {
      roundedRect(ctx, x + 1, y + 1, size - 2, size - 2, radius);
      ctx.stroke();
    } else {
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    }
  }
}

export function drawBoard(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: DrawOptions
): void {
  const { board, cellSize, cellStyle, cellGap, scale, panX, panY } = options;
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
  };

  ctx.clearRect(0, 0, w, h);

  const cols = board[0]?.length ?? 0;
  const rows = board.length;
  const boardW = cellSize * cols + cellGap * (cols - 1);
  const boardH = cellSize * rows + cellGap * (rows - 1);
  const cx = boardW / 2;
  const cy = boardH / 2;
  const radius = cellStyle === 'rounded' ? 6 : 0;

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
      const x = c * (cellSize + cellGap);
      const y = r * (cellSize + cellGap);
      const isFocused =
        options.focusedCell !== null &&
        options.focusedCell[0] === r &&
        options.focusedCell[1] === c;
      drawCell(ctx, cell, x, y, cellSize, isFocused, colors, radius);
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
  panY: number,
  cellGap = 0
): [number, number] | null {
  const cx = boardWidth / 2;
  const cy = boardHeight / 2;

  const boardX = (canvasX - cx - panX) / scale + cx;
  const boardY = (canvasY - cy - panY) / scale + cy;

  const step = cellSize + cellGap;
  const col = Math.floor(boardX / step);
  const row = Math.floor(boardY / step);

  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    return null;
  }

  // Check if click is in the gap between cells
  if (cellGap > 0) {
    const localX = boardX - col * step;
    const localY = boardY - row * step;
    if (localX > cellSize || localY > cellSize) {
      return null; // Click was in the gap
    }
  }

  return [row, col];
}
