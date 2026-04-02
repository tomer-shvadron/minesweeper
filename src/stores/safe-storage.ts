import type { StateStorage } from 'zustand/middleware';

/**
 * A localStorage adapter that catches quota/security exceptions.
 * Zustand's default storage doesn't handle QuotaExceededError or
 * SecurityError (private browsing), causing silent failures or crashes.
 */
export const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // QuotaExceededError or SecurityError — degrade gracefully
      if (import.meta.env.DEV) {
        console.warn(`[safe-storage] Failed to write "${name}"`);
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};
