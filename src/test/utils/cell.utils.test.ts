/**
 * Tests for cell utility functions.
 */
import { describe, expect, it } from 'vitest';

import { cellKey } from '@/utils/cell.utils';

describe('cellKey', () => {
  it('generates correct key for [0,0]', () => {
    expect(cellKey(0, 0)).toBe('0,0');
  });

  it('generates correct key for arbitrary coordinates', () => {
    expect(cellKey(15, 29)).toBe('15,29');
  });

  it('generates unique keys for different coordinates', () => {
    expect(cellKey(1, 23)).not.toBe(cellKey(12, 3));
  });

  it('generates consistent keys on repeated calls', () => {
    expect(cellKey(5, 5)).toBe(cellKey(5, 5));
  });
});
