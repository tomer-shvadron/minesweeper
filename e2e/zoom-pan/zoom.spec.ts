import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures'

async function getScale(page: Page): Promise<number> {
  return page.evaluate(() => {
    const board = document.querySelector('[data-testid="board"]')
    if (!board) {
      return 1
    }
    const inner = board.firstElementChild as HTMLElement | null
    if (!inner) {
      return 1
    }
    const transform = inner.style.transform
    if (!transform || transform === 'none') {
      return 1
    }
    const match = transform.match(/scale\(([\d.]+)\)/)
    return match ? parseFloat(match[1] ?? '1') : 1
  })
}

test.describe('Zoom and pan', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.startPreset('Beginner')
  })

  test('board starts at scale 1', async ({ gamePage }) => {
    const scale = await getScale(gamePage.page)
    expect(scale).toBeCloseTo(1, 1)
  })

  test('zoom resets to 1 on win', async ({ gamePage }) => {
    await gamePage.winGame()
    await gamePage.waitForStatus('won')
    const scale = await getScale(gamePage.page)
    expect(scale).toBeCloseTo(1, 1)
  })

  test('zoom resets to 1 on loss', async ({ gamePage }) => {
    await gamePage.loseGame()
    await gamePage.waitForStatus('lost')
    const scale = await getScale(gamePage.page)
    expect(scale).toBeCloseTo(1, 1)
  })

  test('board transform resets on viewport resize (orientation change simulation)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 852, height: 393 }) // landscape
    await page.waitForTimeout(300)
    await page.setViewportSize({ width: 393, height: 852 }) // back to portrait
    await page.waitForTimeout(300)
    const scale = await getScale(page)
    expect(scale).toBeCloseTo(1, 1)
  })
})
