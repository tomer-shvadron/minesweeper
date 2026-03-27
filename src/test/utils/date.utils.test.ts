import { describe, expect, it, vi } from 'vitest'

import { formatRelativeDate } from '@/utils/date.utils'

describe('formatRelativeDate', () => {
  function isoSecondsAgo(seconds: number): string {
    return new Date(Date.now() - seconds * 1000).toISOString()
  }

  it('returns "just now" for < 1 minute', () => {
    expect(formatRelativeDate(isoSecondsAgo(30))).toBe('just now')
  })

  it('returns minutes ago for < 1 hour', () => {
    expect(formatRelativeDate(isoSecondsAgo(5 * 60))).toBe('5m ago')
    expect(formatRelativeDate(isoSecondsAgo(59 * 60))).toBe('59m ago')
  })

  it('returns hours ago for < 24 hours', () => {
    expect(formatRelativeDate(isoSecondsAgo(2 * 3600))).toBe('2h ago')
    expect(formatRelativeDate(isoSecondsAgo(23 * 3600))).toBe('23h ago')
  })

  it('returns "yesterday" for ~1 day ago', () => {
    expect(formatRelativeDate(isoSecondsAgo(25 * 3600))).toBe('yesterday')
  })

  it('returns days ago for 2-6 days', () => {
    expect(formatRelativeDate(isoSecondsAgo(3 * 86400))).toBe('3d ago')
  })

  it('returns formatted date for >= 7 days', () => {
    // Use a fixed date so the assertion is stable
    const date = new Date('2026-01-01T12:00:00Z')
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
    const result = formatRelativeDate(date.toISOString())
    expect(result).toBe('Jan 1')
    vi.useRealTimers()
  })
})
