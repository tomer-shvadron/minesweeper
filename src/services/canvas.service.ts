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
  scale: number;
  panX: number;
  panY: number;
  focusedCell: [number, number] | null;
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
  colors: DrawColors
): void {
  const borderW = Math.max(1, Math.round(size * 0.08));

  if (!cell.isRevealed) {
    // Raised cell
    ctx.fillStyle = colors.surface;
    ctx.fillRect(x, y, size, size);

    // Top / left highlight
    ctx.fillStyle = colors.borderLight;
    ctx.fillRect(x, y, size, borderW);
    ctx.fillRect(x, y, borderW, size);

    // Bottom / right shadow
    ctx.fillStyle = colors.borderDark;
    ctx.fillRect(x, y + size - borderW, size, borderW);
    ctx.fillRect(x + size - borderW, y, borderW, size);

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
    ctx.fillRect(x, y, size, size);

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
  const boardW = cellSize * cols;
  const boardH = cellSize * board.length;
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
      drawCell(ctx, cell, x, y, cellSize, isFocused, colors);
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
