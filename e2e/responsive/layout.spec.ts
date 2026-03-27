import { test, expect } from '../fixtures';

test.describe('Responsive layout', () => {
  test('board fits viewport width in portrait (iPhone)', async ({ gamePage, page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await gamePage.startPreset('Beginner');
    const boardBox = await gamePage.board.boundingBox();
    expect(boardBox).not.toBeNull();
    if (!boardBox) {
      return;
    }
    expect(boardBox.width).toBeLessThanOrEqual(393);
    expect(boardBox.x).toBeGreaterThanOrEqual(0);
  });

  test('no horizontal overflow in portrait', async ({ gamePage, page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await gamePage.startPreset('Beginner');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(393 + 5);
  });

  test('header visible in portrait', async ({ gamePage, page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await gamePage.startPreset('Beginner');
    const smileyBox = await gamePage.smiley.boundingBox();
    expect(smileyBox).not.toBeNull();
    if (!smileyBox) {
      return;
    }
    expect(smileyBox.y).toBeGreaterThanOrEqual(0);
    expect(smileyBox.y).toBeLessThan(300);
  });

  test('board fits viewport in landscape', async ({ gamePage, page }) => {
    await page.setViewportSize({ width: 852, height: 393 });
    await gamePage.startPreset('Beginner');
    const boardBox = await gamePage.board.boundingBox();
    expect(boardBox).not.toBeNull();
    if (!boardBox) {
      return;
    }
    expect(boardBox.width).toBeLessThanOrEqual(852);
  });

  test('header elements visible in landscape', async ({ gamePage, page }) => {
    await page.setViewportSize({ width: 852, height: 393 });
    await gamePage.startPreset('Beginner');
    await expect(gamePage.smiley).toBeVisible();
    await expect(gamePage.mineCounter).toBeVisible();
    await expect(gamePage.timer).toBeVisible();
  });

  test('modals fit within portrait viewport', async ({ gamePage, page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await gamePage.smiley.click();
    const modalBox = await gamePage.newGameModal().boundingBox();
    expect(modalBox).not.toBeNull();
    if (!modalBox) {
      return;
    }
    expect(modalBox.x).toBeGreaterThanOrEqual(0);
    expect(modalBox.x + modalBox.width).toBeLessThanOrEqual(393 + 5);
  });

  test('GameOverBanner visible after loss', async ({ gamePage, page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await gamePage.startPreset('Beginner');
    await gamePage.loseGame();
    const bannerBox = await gamePage.gameOverBanner.boundingBox();
    expect(bannerBox).not.toBeNull();
    if (!bannerBox) {
      return;
    }
    expect(bannerBox.y).toBeGreaterThan(0);
    // Banner top must be within the viewport (bottom may extend into safe-area padding)
    expect(bannerBox.y).toBeLessThan(852);
  });
});
