/**
 * Tests for game constants and detectPreset utility.
 */
import { describe, expect, it } from 'vitest';

import { DIFFICULTY_PRESETS, detectPreset, SAFE_ZONE_SIZE } from '@/constants/game.constants';

describe('detectPreset', () => {
  it('detects beginner preset', () => {
    expect(detectPreset(DIFFICULTY_PRESETS.beginner)).toBe('beginner');
  });

  it('detects intermediate preset', () => {
    expect(detectPreset(DIFFICULTY_PRESETS.intermediate)).toBe('intermediate');
  });

  it('detects expert preset', () => {
    expect(detectPreset(DIFFICULTY_PRESETS.expert)).toBe('expert');
  });

  it('returns "custom" for non-preset config', () => {
    expect(detectPreset({ rows: 7, cols: 7, mines: 5 })).toBe('custom');
  });

  it('returns "custom" when only rows differ from preset', () => {
    expect(detectPreset({ rows: 10, cols: 9, mines: 10 })).toBe('custom');
  });

  it('returns "custom" when only mines differ from preset', () => {
    expect(detectPreset({ rows: 9, cols: 9, mines: 11 })).toBe('custom');
  });
});

describe('DIFFICULTY_PRESETS', () => {
  it('beginner has 9×9 with 10 mines', () => {
    expect(DIFFICULTY_PRESETS.beginner).toEqual({ rows: 9, cols: 9, mines: 10 });
  });

  it('intermediate has 16×16 with 40 mines', () => {
    expect(DIFFICULTY_PRESETS.intermediate).toEqual({ rows: 16, cols: 16, mines: 40 });
  });

  it('expert has 16×30 with 99 mines', () => {
    expect(DIFFICULTY_PRESETS.expert).toEqual({ rows: 16, cols: 30, mines: 99 });
  });

  it('all presets have valid mine count (< rows*cols - SAFE_ZONE_SIZE)', () => {
    for (const [key, preset] of Object.entries(DIFFICULTY_PRESETS)) {
      const maxMines = preset.rows * preset.cols - SAFE_ZONE_SIZE;
      expect(preset.mines, `${key} mines should be <= ${maxMines}`).toBeLessThanOrEqual(maxMines);
    }
  });
});
