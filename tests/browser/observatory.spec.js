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
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.locator('#year-output')).toHaveText('2014');
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
