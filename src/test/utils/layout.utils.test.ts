import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  BOARD_PADDING,
  FLOATING_PILLS_HEIGHT,
  GAME_OVER_BANNER_HEIGHT,
  MOBILE_LANDSCAPE_TOP_BAR_HEIGHT,
  NAV_BAR_HEIGHT,
  calcCellSize,
  getLayoutMode,
} from '@/utils/layout.utils';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    writable: true,
    configurable: true,
  });
}

describe('calcCellSize', () => {
  beforeEach(() => {
    setViewport(390, 844); // iPhone 14 Pro as baseline
  });

  afterEach(() => {
    setViewport(1024, 768); // restore reasonable default
  });

  it('returns a value that fits the board within available width', () => {
    setViewport(390, 844);
    const size = calcCellSize(9, 9);
    const availW = 390 - BOARD_PADDING * 2;
    expect(size * 9).toBeLessThanOrEqual(availW);
  });

  it('returns a value that fits the board within available height', () => {
    setViewport(390, 844);
    const size = calcCellSize(9, 9);
    const availH =
      844 - NAV_BAR_HEIGHT - FLOATING_PILLS_HEIGHT - GAME_OVER_BANNER_HEIGHT - BOARD_PADDING * 2;
    expect(size * 9).toBeLessThanOrEqual(availH);
  });

  it('is constrained by width when width is the bottleneck', () => {
    setViewport(200, 2000);
    const size = calcCellSize(9, 9);
    const availW = 200 - BOARD_PADDING * 2;
    // Natural cell size from width, clamped to max
    const natural = Math.floor(availW / 9);
    expect(size).toBe(Math.max(12, Math.min(natural, 72))); // 72 = MAX_CELL_MOBILE (medium)
  });

  it('is constrained by height when height is the bottleneck', () => {
    // 2000×400 with coarse pointer = mobile-landscape → top bar (44px), no floating pills, no bottom nav
    setViewport(2000, 400);
    const size = calcCellSize(9, 9);
    const availH =
      400 - BOARD_PADDING * 2 - MOBILE_LANDSCAPE_TOP_BAR_HEIGHT - GAME_OVER_BANNER_HEIGHT;
    // Natural height-based cell size, capped by max cell size
    const naturalFromH = Math.floor(availH / 9);
    expect(size).toBeLessThanOrEqual(naturalFromH);
    expect(size).toBeGreaterThanOrEqual(12);
  });

  it('never returns less than 12px even on a tiny viewport', () => {
    setViewport(100, 100);
    expect(calcCellSize(30, 50)).toBeGreaterThanOrEqual(12);
    expect(calcCellSize(50, 50)).toBeGreaterThanOrEqual(12);
  });

  it('returns a larger cell size for a smaller board', () => {
    setViewport(390, 844);
    const beginnerSize = calcCellSize(9, 9);
    const expertSize = calcCellSize(16, 30);
    expect(beginnerSize).toBeGreaterThan(expertSize);
  });

  it('expert board (16x30) is clamped to the 12px minimum on a typical phone', () => {
    setViewport(390, 844);
    const size = calcCellSize(16, 30);
    expect(size).toBe(12);
  });

  it('caps cell size on large desktop screens', () => {
    // Simulate a desktop with fine pointer
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: query === '(pointer: fine)',
        media: query,
      }),
      writable: true,
      configurable: true,
    });
    setViewport(1920, 1080);
    const size = calcCellSize(9, 9);
    // 72px is MAX_CELL_DESKTOP for default 'medium' board size
    expect(size).toBeLessThanOrEqual(72);
    expect(size).toBeGreaterThanOrEqual(12);
  });

  it('reserves space for game-over banner', () => {
    setViewport(390, 844);
    const size = calcCellSize(9, 9);
    const totalUsed =
      size * 9 +
      BOARD_PADDING * 2 +
      NAV_BAR_HEIGHT +
      FLOATING_PILLS_HEIGHT +
      GAME_OVER_BANNER_HEIGHT;
    expect(totalUsed).toBeLessThanOrEqual(844);
  });
});

describe('getLayoutMode', () => {
  afterEach(() => {
    setViewport(1024, 768);
  });

  it('returns desktop when fine pointer and viewport >= 600px', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: query === '(pointer: fine)',
        media: query,
      }),
      writable: true,
      configurable: true,
    });
    setViewport(1024, 768);
    expect(getLayoutMode()).toBe('desktop');
  });

  it('returns mobile-portrait when fine pointer but viewport < 600px and portrait', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: query === '(pointer: fine)',
        media: query,
      }),
      writable: true,
      configurable: true,
    });
    setViewport(500, 800);
    expect(getLayoutMode()).toBe('mobile-portrait');
  });

  it('returns mobile-landscape when fine pointer but viewport < 600px and landscape', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: query === '(pointer: fine)',
        media: query,
      }),
      writable: true,
      configurable: true,
    });
    setViewport(599, 400);
    expect(getLayoutMode()).toBe('mobile-landscape');
  });

  it('returns mobile-portrait when coarse pointer and portrait', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: false,
        media: query,
      }),
      writable: true,
      configurable: true,
    });
    setViewport(390, 844);
    expect(getLayoutMode()).toBe('mobile-portrait');
  });

  it('returns mobile-landscape when coarse pointer and landscape', () => {
    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: false,
        media: query,
      }),
      writable: true,
      configurable: true,
    });
    setViewport(844, 390);
    expect(getLayoutMode()).toBe('mobile-landscape');
  });
});
