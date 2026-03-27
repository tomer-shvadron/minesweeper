import { test, expect } from '../fixtures';

test.describe('Settings modal', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Settings' }).click();
    await gamePage.settingsModal().waitFor();
  });

  test('settings modal opens and is visible', async ({ gamePage }) => {
    await expect(gamePage.settingsModal()).toBeVisible();
  });

  test('closes with X button', async ({ gamePage }) => {
    await gamePage.page.getByRole('button', { name: 'Close' }).click();
    await expect(gamePage.settingsModal()).not.toBeVisible();
  });

  test('closes with Escape key', async ({ gamePage }) => {
    await gamePage.page.keyboard.press('Escape');
    await expect(gamePage.settingsModal()).not.toBeVisible();
  });

  test('sound toggle changes state', async ({ gamePage }) => {
    const soundToggle = gamePage.page.locator('[role="switch"]').first();
    const initialState = await soundToggle.getAttribute('aria-checked');
    await soundToggle.click();
    const newState = await soundToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('animation toggle changes state', async ({ gamePage }) => {
    const toggles = gamePage.page.locator('[role="switch"]');
    const count = await toggles.count();
    const animToggle = toggles.nth(count - 1);
    const initialState = await animToggle.getAttribute('aria-checked');
    await animToggle.click();
    const newState = await animToggle.getAttribute('aria-checked');
    expect(newState).not.toBe(initialState);
  });

  test('modal does not affect game state', async ({ gamePage }) => {
    await gamePage.page.keyboard.press('Escape');
    const state = await gamePage.getGameState();
    expect(state.status).toBe('idle');
  });
});
