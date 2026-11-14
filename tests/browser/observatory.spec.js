import { expect, test } from '@playwright/test';

test('plays and compares actual NASA records', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hear the Earth.' })).toBeVisible();
  await expect(page.locator('#primary-value')).toHaveText('+2.93°C');
  await expect(page.locator('#earth')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Reset globe view' }).click();
  await page.locator('[data-insight="polar-split"]').click();
  await expect(page.locator('#year-output')).toHaveText('2016');
  await expect(page.locator('#primary-value')).toHaveText('+3.23°C');
  await expect(page.locator('#compare-value')).toHaveText('+0.35°C');
  await page.getByText('View selected data as a table').click();
  await expect(page.getByRole('row').filter({ hasText: '2016' })).toContainText('+3.23°C');
  await page.getByText('Playback range and speed').click();
  await page.getByLabel('Years / sec').selectOption('2');
  await page.locator('#year-output').evaluate((element) => {
    const playedYears = [];
    new MutationObserver(() => playedYears.push(element.textContent)).observe(element, { childList: true });
    window.earthsonaPlayedYears = playedYears;
  });
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.earthsonaPlayedYears[0])).toBe('2014');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mute', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unmute' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Compare with').selectOption('');
  await expect(page.getByText('Play track')).toBeVisible();
  expect(errors).toEqual([]);
});

test('scans all three official NASA maps then plays a numeric observation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'NASA frames' }).click();
  for (const year of ['2025', '2024', '2023']) {
    await page.getByRole('button', { name: year, exact: true }).click();
    await expect(page.locator('#eic-image')).toHaveAttribute('alt', new RegExp(year));
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.locator('#frame-beam')).toBeVisible();
    await expect(page.locator('#scan-status')).toContainText('Hz');
  }
  await page.getByLabel('Sound source').selectOption('data');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('#scan-status')).toContainText('+1.17°C');
  await expect(page.locator('#audio-message')).toBeHidden();
});

test('mobile layout and the missing-texture fallback keep data available', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.route('**/blue-marble-july-2004.webp', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByText(/BASEMAP UNAVAILABLE/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByLabel('Primary track').selectOption('global');
  await expect(page.locator('#primary-value')).toHaveText('+1.19°C');
  await expect(page.getByRole('link', { name: 'Raw CSV' })).toHaveAttribute('download', '');
});

test('Luma opens by keyboard, plays NASA data, and reveals reproducible evidence', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const launch = page.getByRole('button', { name: 'Listen with Luma' });
  await launch.focus();
  await page.keyboard.press('Enter');
  const guide = page.getByRole('dialog');
  await expect(guide.getByRole('heading', { name: 'Hear NASA’s map' })).toBeFocused();
  await guide.getByRole('button', { name: 'Play 2025 map scan' }).click();
  await expect(guide.locator('.guide-frame-beam')).toBeVisible();
  await guide.getByRole('button', { name: 'Continue' }).click();
  await guide.getByRole('button', { name: 'Hear both pairs' }).click();
  await expect(guide.locator('[data-tone="1980-arctic"]')).toHaveAttribute('data-active', 'true');
  await expect(guide.locator('[data-tone="2016-arctic"]')).toHaveAttribute('data-active', 'true');
  await guide.getByRole('button', { name: 'Reveal the result' }).click();
  await expect(guide.locator('.guide-finding')).toContainText('+2.38°C');
  await expect(guide.locator('.guide-finding')).toContainText('+0.77°C');
  await expect(guide.getByRole('table')).toContainText('+2.62°C');
  await page.keyboard.press('Escape');
  await expect(guide).toBeHidden();
  await expect(launch).toBeFocused();
});

test('dark mode persists and reduced motion keeps the title and sky stable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.title-particles')).toHaveCount(0);
  const toggle = page.getByRole('button', { name: 'Dark mode' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const starMap = page.locator('#sky-backdrop');
  const position = () => starMap.evaluate((element) => getComputedStyle(element).backgroundPosition);
  const initialPosition = await position();
  await page.locator('#earth').focus();
  await page.keyboard.press('ArrowRight');
  expect(await position()).toEqual(initialPosition);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test('the staggered title reveal replays on reload and the sky tracks globe rotation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.title-particles')).toHaveCount(1);
  const text = page.locator('.title-reveal-text');
  const firstMask = await text.evaluate((element) => element.style.maskImage);
  await expect.poll(() => text.evaluate((element) => element.style.maskImage)).not.toBe(firstMask);
  await expect(page.locator('.title-particles')).toHaveCount(0, { timeout: 6000 });
  await page.reload();
  await expect(page.locator('.title-particles')).toHaveCount(1);
  await expect(page.locator('#hero-title')).toHaveText('Hear the Earth.');
  const sky = page.locator('#sky-backdrop');
  await expect(sky).toHaveCSS('background-position', '50% 50%, 50% 50%');
  await page.locator('#earth').focus();
  await page.keyboard.press('ArrowRight');
  await expect(sky).not.toHaveCSS('background-position', '50% 50%, 50% 50%');
});

test('roaming Luma opens the tour, highlights the app and resumes after the experiment', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const pet = page.getByRole('complementary', { name: 'Luma companion' });
  const launcher = pet.getByRole('button', { name: 'Meet Luma' });
  await launcher.focus();
  await page.keyboard.press('Enter');
  await pet.getByRole('button', { name: 'Take the tour' }).click();
  const tour = page.locator('#luma-tour');
  await expect(tour.locator('#tour-title')).toBeFocused();
  await expect(tour).toHaveAttribute('data-step', '1');
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour).toHaveAttribute('data-target', '.frame-mat');
  await tour.getByRole('button', { name: 'Play the map scan' }).click();
  await expect(page.locator('#frame-beam')).toBeVisible();
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('#comparison')).toHaveValue('global');
  await tour.getByRole('button', { name: 'Next' }).click();
  await tour.getByRole('button', { name: 'Hear the two periods' }).click();
  const experiment = page.locator('#luma-guide');
  await expect(experiment.getByRole('heading', { name: 'Hear the Arctic pull away' })).toBeFocused();
  await experiment.getByRole('button', { name: 'Reveal the result' }).click();
  await expect(experiment.locator('#guide-evidence')).toContainText('+2.38°C');
  await experiment.getByRole('button', { name: 'Continue the tour' }).click();
  await expect(tour).toHaveAttribute('data-step', '5');
  await tour.getByRole('button', { name: 'Next' }).click();
  await expect(tour).toHaveAttribute('data-step', '6');
  await tour.getByRole('button', { name: 'Finish tour' }).click();
  await expect(page.locator('#method')).toBeFocused();
  await expect(tour).toBeHidden();
  await expect(launcher).toBeVisible();
});

test('the particle canvas stays within the narrowest supported viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(page.locator('.title-particles')).toHaveCount(1);
  await expect.poll(() => page.locator('.title-particles').evaluate((element) => element.width)).toBeGreaterThan(310);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
