import type { Theme } from '@/types/settings.types';

/** Detects whether the device is likely an iOS device (iPhone or iPad). */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent;
  return /iPhone|iPad/i.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
}

/** Returns the recommended default theme based on the current platform. */
export function detectDefaultTheme(): Theme {
  return 'light';
}
