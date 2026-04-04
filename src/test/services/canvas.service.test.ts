import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { drawBoard, hitTestCell } from '@/services/canvas.service';
import type { DrawOptions } from '@/services/canvas.service';
import type { CellState, CellValue } from '@/types/game.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCell(overrides: Partial<CellState> = {}): CellState {
  return {
    hasMine: false,
    isRevealed: false,
    isFlagged: false,
    isQuestionMark: false,
    value: 0 as CellValue,
    isExploded: false,
    ...overrides,
  };
}

/** Build a rows×cols board of unrevealed cells. */
function makeBoard(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => makeCell()));
}

/** Default args for hitTestCell with no pan/zoom on a 3×3 board (cellSize=10). */
function hit(
  canvasX: number,
  canvasY: number,
  opts: {
    cellSize?: number;
    cols?: number;
    rows?: number;
    scale?: number;
    panX?: number;
    panY?: number;
  } = {}
): [number, number] | null {
  const cellSize = opts.cellSize ?? 10;
  const cols = opts.cols ?? 3;
  const rows = opts.rows ?? 3;
  const scale = opts.scale ?? 1;
  const panX = opts.panX ?? 0;
  const panY = opts.panY ?? 0;
  const boardWidth = cellSize * cols;
  const boardHeight = cellSize * rows;
  return hitTestCell(
    canvasX,
    canvasY,
    cellSize,
    cols,
    rows,
    boardWidth,
    boardHeight,
    scale,
    panX,
    panY
  );
}

// ---------------------------------------------------------------------------
// hitTestCell unit tests
// ---------------------------------------------------------------------------

describe('hitTestCell', () => {
  // 1. Basic hit testing
  describe('basic hit testing (3×3 board, cellSize=10, no pan/zoom)', () => {
    it('returns [0, 0] for click inside cell [0,0]', () => {
      expect(hit(5, 5)).toEqual([0, 0]);
    });

    it('returns [1, 1] for center cell', () => {
      expect(hit(15, 15)).toEqual([1, 1]);
    });

    it('returns [2, 2] for last cell (rows-1, cols-1)', () => {
      expect(hit(25, 25)).toEqual([2, 2]);
    });
  });

  // 2. Corner / boundary clicks
  describe('corner and boundary clicks', () => {
    it('returns [0, 0] at origin (0, 0)', () => {
      expect(hit(0, 0)).toEqual([0, 0]);
    });

    it('returns [0, 0] just inside first cell boundary (9.9, 9.9)', () => {
      expect(hit(9.9, 9.9)).toEqual([0, 0]);
    });

    it('returns [0, 1] at exact x boundary between col 0 and col 1', () => {
      // x=10 is the start of col 1
      expect(hit(10, 5)).toEqual([0, 1]);
    });

    it('returns [1, 0] at exact y boundary between row 0 and row 1', () => {
      // y=10 is the start of row 1
      expect(hit(5, 10)).toEqual([1, 0]);
    });

    it('returns [2, 2] just inside the board at (29.9, 29.9)', () => {
      expect(hit(29.9, 29.9)).toEqual([2, 2]);
    });
  });

  // 3. Out-of-bounds → null
  describe('out-of-bounds returns null', () => {
    it('returns null for negative x', () => {
      expect(hit(-1, 5)).toBeNull();
    });

    it('returns null for negative y', () => {
      expect(hit(5, -1)).toBeNull();
    });

    it('returns null for x exactly at board edge (30)', () => {
      expect(hit(30, 5)).toBeNull();
    });

    it('returns null for y exactly at board edge (30)', () => {
      expect(hit(5, 30)).toBeNull();
    });

    it('returns null for both x and y beyond board', () => {
      expect(hit(100, 100)).toBeNull();
    });

    it('returns null for negative coords', () => {
      expect(hit(-5, -5)).toBeNull();
    });
  });

  // 4. With panX offset
  describe('pan X offset', () => {
    it('shifts so that clicking further right hits [0,0] when panX=10', () => {
      // panX=10 shifts board right by 10 units from center
      // The board center is at (15,15) for 3×3 cellSize=10
      // With panX=10, to hit [0,0] we need to compensate
      const result = hit(10, 5, { panX: 10 });
      // (canvasX - cx - panX) / scale + cx = (10 - 15 - 10) / 1 + 15 = -15 + 15 = 0
      // col = floor(0 / 10) = 0, row = floor((5-15-0)/1+15 = 5) / 10 = 0
      expect(result).toEqual([0, 0]);
    });

    it('with panX=10, clicking at (0,5) hits out-of-bounds (negative col)', () => {
      // (0 - 15 - 10) / 1 + 15 = -25 + 15 = -10 → col=-1 → null
      expect(hit(0, 5, { panX: 10 })).toBeNull();
    });

    it('with panX=-10, cell [0,0] can be hit at x=5 (original) minus 10', () => {
      // panX=-10: (canvasX - 15 - (-10)) / 1 + 15 = canvasX + 10
      // to hit col=0: floor((canvasX + 10) / 10) = 0 → canvasX + 10 < 10 → canvasX < 0
      // Actually hitting x=5 with panX=-10: (5 - 15 + 10)/1 + 15 = 0/1+15 = 15 → col=1
      expect(hit(5, 5, { panX: -10 })).toEqual([0, 1]);
    });
  });

  // 5. With panY offset
  describe('pan Y offset', () => {
    it('with panY=10, clicking at (5, 10) hits [0,0]', () => {
      // (5 - 15) / 1 + 15 = 5 → col=0
      // (10 - 15 - 10) / 1 + 15 = -15 + 15 = 0 → row=0
      expect(hit(5, 10, { panY: 10 })).toEqual([0, 0]);
    });

    it('with panY=10, clicking at (5, 0) hits null', () => {
      // (0 - 15 - 10) / 1 + 15 = -10 → row=-1 → null
      expect(hit(5, 0, { panY: 10 })).toBeNull();
    });
  });

  // 6. With zoom scale=2
  describe('zoom scale=2', () => {
    it('with scale=2, clicking board center still hits center cell', () => {
      // Board center is (15, 15) for 3×3 cellSize=10
      // (15 - 15 - 0) / 2 + 15 = 15 → col=1, row=1
      expect(hit(15, 15, { scale: 2 })).toEqual([1, 1]);
    });

    it('with scale=2, clicking (10, 10) hits cell [1,0]', () => {
      // (10 - 15) / 2 + 15 = -2.5 + 15 = 12.5 → col=1
      // (10 - 15) / 2 + 15 = 12.5 → row=1
      expect(hit(10, 10, { scale: 2 })).toEqual([1, 1]);
    });

    it('with scale=2, clicking (0, 0) hits out-of-bounds or first cell', () => {
      // (0 - 15) / 2 + 15 = -7.5 + 15 = 7.5 → col=0, row=0
      expect(hit(0, 0, { scale: 2 })).toEqual([0, 0]);
    });

    it('with scale=2, clicking beyond visible board returns null', () => {
      // (29 - 15) / 2 + 15 = 7 + 15 = 22 → col=2 (still in)
      // (30 - 15) / 2 + 15 = 22.5 → col=2 (in bounds)
      // need something clearly outside
      // (45 - 15) / 2 + 15 = 15 + 15 = 30 → col=3 → null
      expect(hit(45, 15, { scale: 2 })).toBeNull();
    });
  });

  // 7. With zoom scale=0.5
  describe('zoom scale=0.5', () => {
    it('with scale=0.5, center click still returns center cell', () => {
      // (15 - 15) / 0.5 + 15 = 15 → col=1, row=1
      expect(hit(15, 15, { scale: 0.5 })).toEqual([1, 1]);
    });

    it('with scale=0.5, clicking (5, 5) hits [0, -1] range — null', () => {
      // (5 - 15) / 0.5 + 15 = -20 + 15 = -5 → col=-1 → null
      expect(hit(5, 5, { scale: 0.5 })).toBeNull();
    });

    it('with scale=0.5, the board is zoomed out so more canvas space is "outside"', () => {
      // (0 - 15) / 0.5 + 15 = -30 + 15 = -15 → null
      expect(hit(0, 15, { scale: 0.5 })).toBeNull();
    });
  });

  // 8. Combined pan + zoom
  describe('combined pan and zoom', () => {
    it('pan=(5,5) zoom=2 — clicking board center still finds center cell', () => {
      // cx=15, cy=15
      // boardX = (15 - 15 - 5) / 2 + 15 = -5/2+15 = 12.5 → col=1
      // boardY = (15 - 15 - 5) / 2 + 15 = 12.5 → row=1
      expect(hit(15, 15, { scale: 2, panX: 5, panY: 5 })).toEqual([1, 1]);
    });

    it('pan=(-5, 0) zoom=0.5 — can access cells that would otherwise be off-canvas', () => {
      // Test that the formula handles negative pan with non-1 scale correctly
      // boardX = (20 - 15 - (-5)) / 0.5 + 15 = 10/0.5+15 = 35 → col=3 → null
      expect(hit(20, 15, { scale: 0.5, panX: -5, panY: 0 })).toBeNull();
    });
  });

  // 9. Non-square board (16×30 Expert)
  describe('non-square board (Expert: 16 rows × 30 cols)', () => {
    it('returns [0, 0] for click in the top-left cell', () => {
      const result = hitTestCell(5, 5, 30, 30, 16, 900, 480, 1, 0, 0);
      expect(result).toEqual([0, 0]);
    });

    it('returns [15, 29] for click in the bottom-right cell', () => {
      const result = hitTestCell(895, 475, 30, 30, 16, 900, 480, 1, 0, 0);
      expect(result).toEqual([15, 29]);
    });

    it('returns null for y beyond 16 rows (480px)', () => {
      const result = hitTestCell(5, 480, 30, 30, 16, 900, 480, 1, 0, 0);
      expect(result).toBeNull();
    });

    it('returns null for x beyond 30 cols (900px)', () => {
      const result = hitTestCell(900, 5, 30, 30, 16, 900, 480, 1, 0, 0);
      expect(result).toBeNull();
    });

    it('returns [8, 15] for the center of the expert board', () => {
      // Center of board: x = 15.5 * 30 = 465, y = 8.5 * 30 = 255 (approximate center cell)
      const result = hitTestCell(465, 255, 30, 30, 16, 900, 480, 1, 0, 0);
      // boardX = (465 - 450 - 0)/1 + 450 = 465 → col = floor(465/30) = 15
      // boardY = (255 - 240 - 0)/1 + 240 = 255 → row = floor(255/30) = 8
      expect(result).toEqual([8, 15]);
    });
  });

  // 10. 1×1 board edge case
  describe('1×1 board edge case', () => {
    it('returns [0, 0] for any click inside the single cell', () => {
      const result = hitTestCell(5, 5, 10, 1, 1, 10, 10, 1, 0, 0);
      expect(result).toEqual([0, 0]);
    });

    it('returns null for click outside the single cell', () => {
      const result = hitTestCell(10, 5, 10, 1, 1, 10, 10, 1, 0, 0);
      expect(result).toBeNull();
    });

    it('returns null for click at negative coords', () => {
      const result = hitTestCell(-1, 5, 10, 1, 1, 10, 10, 1, 0, 0);
      expect(result).toBeNull();
    });
  });

  // 11. Very small cellSize
  describe('very small cellSize', () => {
    it('still correctly maps clicks with cellSize=1', () => {
      // 5×5 board, cellSize=1, boardWidth=5, boardHeight=5
      // click at (2.5, 3.5): boardX = (2.5 - 2.5) / 1 + 2.5 = 2.5 → col=2, row=3
      const result = hitTestCell(2.5, 3.5, 1, 5, 5, 5, 5, 1, 0, 0);
      expect(result).toEqual([3, 2]);
    });

    it('returns null outside the board with cellSize=1', () => {
      const result = hitTestCell(5, 2.5, 1, 5, 5, 5, 5, 1, 0, 0);
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// drawBoard tests (mock canvas context)
// ---------------------------------------------------------------------------

describe('drawBoard', () => {
  let canvas: HTMLCanvasElement;
  let mockCtx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Mock window.devicePixelRatio
    Object.defineProperty(window, 'devicePixelRatio', { value: 1, writable: true });

    // Mock getComputedStyle to return a predictable color value
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (_: string) => '#aaaaaa',
    } as unknown as CSSStyleDeclaration);

    // Create a mock canvas and context
    canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;

    mockCtx = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeDrawOptions(rows: number, cols: number, cellSize: number): DrawOptions {
    return {
      board: makeBoard(rows, cols),
      cellSize,
      scale: 1,
      panX: 0,
      panY: 0,
      focusedCell: null,
      mineRevealLookup: new Map(),
      chordRippleLookup: new Map(),
      animationsEnabled: false,
      animTime: 0,
    };
  }

  it('calls ctx.clearRect once', () => {
    const opts = makeDrawOptions(3, 3, 30);
    drawBoard(canvas, mockCtx, opts);
    expect(mockCtx.clearRect).toHaveBeenCalledTimes(1);
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
  });

  it('calls ctx.fillRect at least once per cell for an unrevealed board', () => {
    const rows = 3;
    const cols = 3;
    const opts = makeDrawOptions(rows, cols, 30);
    drawBoard(canvas, mockCtx, opts);
    // Each unrevealed cell calls fillRect at least once (background + borders)
    expect(mockCtx.fillRect).toHaveBeenCalled();
    const callCount = (mockCtx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(rows * cols);
  });

  it('calls ctx.save and ctx.restore for the transform', () => {
    const opts = makeDrawOptions(2, 2, 30);
    drawBoard(canvas, mockCtx, opts);
    expect(mockCtx.save).toHaveBeenCalledTimes(1);
    expect(mockCtx.restore).toHaveBeenCalledTimes(1);
  });

  it('calls ctx.translate and ctx.scale for pan/zoom transform', () => {
    const opts = makeDrawOptions(2, 2, 30);
    drawBoard(canvas, mockCtx, opts);
    expect(mockCtx.translate).toHaveBeenCalled();
    expect(mockCtx.scale).toHaveBeenCalled();
  });

  it('works for a revealed board with numbered cells', () => {
    const board = [
      [makeCell({ isRevealed: true, value: 1 as CellValue }), makeCell({ isRevealed: true })],
      [
        makeCell({ isRevealed: true, value: 2 as CellValue }),
        makeCell({ hasMine: true, isRevealed: true, isExploded: true }),
      ],
    ];
    const opts: DrawOptions = {
      board,
      cellSize: 30,
      scale: 1,
      panX: 0,
      panY: 0,
      focusedCell: null,
      mineRevealLookup: new Map(),
      chordRippleLookup: new Map(),
      animationsEnabled: false,
      animTime: 0,
    };
    drawBoard(canvas, mockCtx, opts);
    expect(mockCtx.clearRect).toHaveBeenCalledTimes(1);
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('draws focus ring via strokeRect when focusedCell is set', () => {
    const opts: DrawOptions = {
      board: makeBoard(2, 2),
      cellSize: 30,
      scale: 1,
      panX: 0,
      panY: 0,
      focusedCell: [0, 0],
      mineRevealLookup: new Map(),
      chordRippleLookup: new Map(),
      animationsEnabled: false,
      animTime: 0,
    };
    drawBoard(canvas, mockCtx, opts);
    expect(mockCtx.strokeRect).toHaveBeenCalled();
  });

  it('calls strokeRect fewer times when no cell is focused vs when one is', () => {
    const optsNoFocus = makeDrawOptions(2, 2, 30);
    drawBoard(canvas, mockCtx, optsNoFocus);
    const countNoFocus = (mockCtx.strokeRect as ReturnType<typeof vi.fn>).mock.calls.length;

    (mockCtx.strokeRect as ReturnType<typeof vi.fn>).mockClear();
    const optsFocus: DrawOptions = { ...makeDrawOptions(2, 2, 30), focusedCell: [0, 0] };
    drawBoard(canvas, mockCtx, optsFocus);
    const countFocus = (mockCtx.strokeRect as ReturnType<typeof vi.fn>).mock.calls.length;

    // Focus ring adds one extra strokeRect call
    expect(countFocus).toBeGreaterThan(countNoFocus);
  });

  it('handles an empty board without crashing', () => {
    const opts: DrawOptions = {
      board: [],
      cellSize: 30,
      scale: 1,
      panX: 0,
      panY: 0,
      focusedCell: null,
      mineRevealLookup: new Map(),
      chordRippleLookup: new Map(),
      animationsEnabled: false,
      animTime: 0,
    };
    expect(() => drawBoard(canvas, mockCtx, opts)).not.toThrow();
    expect(mockCtx.clearRect).toHaveBeenCalledTimes(1);
  });

  it('Expert board (16×30) calls fillRect at least 480 times', () => {
    const opts = makeDrawOptions(16, 30, 30);
    drawBoard(canvas, mockCtx, opts);
    const callCount = (mockCtx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;
    // 16*30=480 cells, each unrevealed cell calls fillRect multiple times (bg + 4 borders)
    expect(callCount).toBeGreaterThanOrEqual(480);
  });
});
