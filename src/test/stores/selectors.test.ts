/**
 * Tests for shared Zustand selectors.
 */
import { describe, expect, it } from 'vitest';

import { selectAllowQuestionMarks, selectIsGameOver } from '@/stores/selectors';

describe('selectIsGameOver', () => {
  it('returns true for "won"', () => {
    expect(selectIsGameOver({ status: 'won' })).toBe(true);
  });

  it('returns true for "lost"', () => {
    expect(selectIsGameOver({ status: 'lost' })).toBe(true);
  });

  it('returns false for "idle"', () => {
    expect(selectIsGameOver({ status: 'idle' })).toBe(false);
  });

  it('returns false for "playing"', () => {
    expect(selectIsGameOver({ status: 'playing' })).toBe(false);
  });

  it('returns false for "generating"', () => {
    expect(selectIsGameOver({ status: 'generating' })).toBe(false);
  });
});

describe('selectAllowQuestionMarks', () => {
  it('returns true for "flags-and-questions"', () => {
    expect(selectAllowQuestionMarks({ flagMode: 'flags-and-questions' })).toBe(true);
  });

  it('returns false for "flags-only"', () => {
    expect(selectAllowQuestionMarks({ flagMode: 'flags-only' })).toBe(false);
  });
});
