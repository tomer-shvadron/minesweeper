import { describe, expect, it } from 'vitest';

import { formatTime } from '@/utils/time.utils';

describe('formatTime', () => {
  it('formats 0 seconds as "0s"', () => {
    expect(formatTime(0)).toBe('0s');
  });

  it('formats values under 60 with an "s" suffix', () => {
    expect(formatTime(1)).toBe('1s');
    expect(formatTime(42)).toBe('42s');
    expect(formatTime(59)).toBe('59s');
  });

  it('formats exactly 60 seconds as "1:00"', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('formats 61 seconds as "1:01"', () => {
    expect(formatTime(61)).toBe('1:01');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(70)).toBe('1:10');
  });

  it('formats 120 seconds as "2:00"', () => {
    expect(formatTime(120)).toBe('2:00');
  });

  it('formats 599 seconds as "9:59"', () => {
    expect(formatTime(599)).toBe('9:59');
  });

  it('formats 3599 seconds as "59:59"', () => {
    expect(formatTime(3599)).toBe('59:59');
  });

  it('handles large values beyond an hour', () => {
    expect(formatTime(9999)).toBe('166:39');
  });
});
