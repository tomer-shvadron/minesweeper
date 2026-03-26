import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  BOARD_PADDING,
  HEADER_HEIGHT,
  HEADER_SIDEBAR_WIDTH,
  calcCellSize,
} from '@/utils/layout.utils'

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true })
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    writable: true,
    configurable: true,
  })
}

describe('calcCellSize', () => {
  beforeEach(() => {
    setViewport(390, 844) // iPhone 14 Pro as baseline
  })

  afterEach(() => {
    setViewport(1024, 768) // restore reasonable default
  })

  it('returns a value that fits the board within available width', () => {
    setViewport(390, 844)
    const size = calcCellSize(9, 9)
    const availW = 390 - BOARD_PADDING * 2
    expect(size * 9).toBeLessThanOrEqual(availW)
  })

  it('returns a value that fits the board within available height', () => {
    setViewport(390, 844)
    const size = calcCellSize(9, 9)
    const availH = 844 - HEADER_HEIGHT - BOARD_PADDING * 2
    expect(size * 9).toBeLessThanOrEqual(availH)
  })

  it('is constrained by width when width is the bottleneck', () => {
    setViewport(200, 2000)
    const size = calcCellSize(9, 9)
    const availW = 200 - BOARD_PADDING * 2
    expect(size).toBe(Math.max(12, Math.floor(availW / 9)))
  })

  it('is constrained by height when height is the bottleneck', () => {
    // 2000×200 is landscape (width > height), so sidebar width is subtracted from W
    // and no header height is subtracted from H
    setViewport(2000, 200)
    const size = calcCellSize(9, 9)
    const availW = 2000 - BOARD_PADDING * 2 - HEADER_SIDEBAR_WIDTH
    const availH = 200 - BOARD_PADDING * 2
    expect(size).toBe(Math.max(12, Math.min(Math.floor(availW / 9), Math.floor(availH / 9))))
  })

  it('never returns less than 12px even on a tiny viewport', () => {
    setViewport(100, 100)
    expect(calcCellSize(30, 50)).toBeGreaterThanOrEqual(12)
    expect(calcCellSize(50, 50)).toBeGreaterThanOrEqual(12)
  })

  it('returns a larger cell size for a smaller board', () => {
    setViewport(390, 844)
    const beginnerSize = calcCellSize(9, 9)
    const expertSize = calcCellSize(16, 30)
    expect(beginnerSize).toBeGreaterThan(expertSize)
  })

  it('expert board (16x30) is clamped to the 12px minimum on a typical phone', () => {
    // Natural cell size = floor(358/30) = 11px, which is below the 12px minimum
    setViewport(390, 844)
    const size = calcCellSize(16, 30)
    expect(size).toBe(12)
  })
})
