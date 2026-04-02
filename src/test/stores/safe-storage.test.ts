/**
 * Tests for the safe-storage adapter that wraps localStorage
 * to handle QuotaExceededError and SecurityError gracefully.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { safeStorage } from '@/stores/safe-storage';

describe('safeStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('getItem', () => {
    it('returns the stored value', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(safeStorage.getItem('test-key')).toBe('test-value');
    });

    it('returns null for missing keys', () => {
      expect(safeStorage.getItem('nonexistent')).toBeNull();
    });

    it('returns null when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });
      expect(safeStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('setItem', () => {
    it('writes to localStorage', () => {
      safeStorage.setItem('test-key', 'test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('does not throw when localStorage.setItem throws QuotaExceededError', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      expect(() => safeStorage.setItem('key', 'value')).not.toThrow();
    });

    it('does not throw when localStorage.setItem throws SecurityError', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });
      expect(() => safeStorage.setItem('key', 'value')).not.toThrow();
    });
  });

  describe('removeItem', () => {
    it('removes from localStorage', () => {
      localStorage.setItem('test-key', 'value');
      safeStorage.removeItem('test-key');
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('does not throw when localStorage.removeItem throws', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('SecurityError');
      });
      expect(() => safeStorage.removeItem('key')).not.toThrow();
    });
  });
});
