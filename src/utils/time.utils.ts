/**
 * Formats elapsed seconds as a compact string.
 * < 60s → "42s"
 * ≥ 60s → "1:05"
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
