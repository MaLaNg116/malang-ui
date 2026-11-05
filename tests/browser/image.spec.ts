import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    await use(errors); expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});
async function openStory(page: Page, name = 'Default', globals = 'theme:light;palette:paper;motion:reduced', source?: string) {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const entry = entries.find(item => item.type === 'story' && item.title === '基础组件/Image 图片' && (item.exportName === name || item.id.endsWith(`--${suffix}`)));
  expect(entry).toBeDefined();
  const query = new URLSearchParams({ id: entry!.id, viewMode: 'story', globals, ...(source ? { args: `src:${source}` } : {}) });
  await page.goto(`/iframe.html?${query}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
const dialog = (page: Page) => page.getByRole('dialog', { name: '图片预览', exact: true });
// Explicit HTTP fixtures remain observable when Vite inlines the small SVGs.
// The relative name also fits Storybook's URL-args sanitization rules.
const imageFixture = 'p1-image-fixture', fixtureRoute = `**/${imageFixture}`;
const inkBytes = readFileSync(new URL('../../stories/assets/archive/ink-gate.svg', import.meta.url));
const jadeMarkup = readFileSync(new URL('../../stories/assets/archive/jade-wheel.svg', import.meta.url), 'utf8');

test('retries a failed native image, keeps one alternative name and ignores events from an obsolete source', async ({ page }) => {
  let attempts = 0;
  await page.route(fixtureRoute, route => ++attempts === 1 ? route.fulfill({ status: 503, contentType: 'text/plain', body: 'Temporarily unavailable' }) : route.fulfill({ contentType: 'image/svg+xml', body: inkBytes }));
  await openStory(page, 'Default', undefined, imageFixture);
  const frame = page.locator('.ui-image').first(), trigger = frame.getByRole('button', { name: '预览图片：墨关 · 水墨机械档案', exact: true });
  await expect(frame).toHaveAttribute('data-state', 'error'); await expect(trigger).toBeDisabled();
  await expect(page.getByRole('img', { name: '墨关 · 水墨机械档案', exact: true })).toHaveCount(1);
  await frame.getByRole('button', { name: '重新载入图片', exact: true }).click();
  await expect(frame).toHaveAttribute('data-state', 'loaded'); await expect(trigger).toBeEnabled();
  const native = frame.locator('img.ui-image__source');
  await expect(native).toHaveAttribute('alt', '墨关 · 水墨机械档案'); await expect(native).toHaveAttribute('loading', 'lazy');
  await expect(native).toHaveAttribute('width', '640'); await expect(native).toHaveAttribute('height', '400'); await expect(native).toHaveAttribute('referrerpolicy', 'no-referrer');
  expect(await native.evaluate(element => getComputedStyle(element).objectFit)).toBe('cover');
  await expect(page.getByTestId('image-events')).toHaveText('载入：1 次 · 失败：1 次');
  expect(attempts).toBe(2); await page.unroute(fixtureRoute);

  await openStory(page, 'SourceChange', undefined, imageFixture);
  await expect(page.locator('.ui-image')).toHaveAttribute('data-state', 'error');
  let release!: () => void, seen!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; }), requested = new Promise<void>(resolve => { seen = resolve; });
  await page.route(fixtureRoute, async route => { seen(); await held; await route.fulfill({ contentType: 'image/svg+xml', body: inkBytes }); });
  try {
    await page.getByRole('button', { name: '载入墨关', exact: true }).click(); await requested;
    const old = await page.locator('img.ui-image__source').elementHandle();
    await expect(page.locator('.ui-image')).toHaveAttribute('data-state', 'loading');
    await expect(page.getByRole('button', { name: '预览图片：可重新载入的档案插图', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '载入青玉机关', exact: true }).click();
    await expect(page.locator('.ui-image')).toHaveAttribute('data-state', 'loaded');
    expect(await old!.evaluate(element => element.isConnected)).toBe(false);
    release();
    await old!.evaluate(element => { element.dispatchEvent(new Event('error')); element.dispatchEvent(new Event('load')); });
    await expect(page.locator('.ui-image')).toHaveAttribute('data-state', 'loaded');
    expect(await page.locator('img.ui-image__source').evaluate(async element => (await fetch((element as HTMLImageElement).currentSrc)).text())).toBe(jadeMarkup);
    await expect(page.getByTestId('image-events')).toHaveText('载入：1 次 · 失败：1 次'); await old?.dispose();
  } finally { release(); await page.unroute(fixtureRoute); }
});

test('opens the chosen gallery item, navigates by keyboard and keeps zooming inside the image pane with safe focus return', async ({ page }) => {
  await openStory(page, 'Gallery');
  const trigger = page.getByRole('button', { name: '预览图片：青玉机关 · 轮轴构形档案', exact: true });
  await expect(trigger).toBeEnabled(); await trigger.focus(); await trigger.press('Enter');
  const modal = dialog(page); await expect(modal).toBeVisible(); await expect(modal.getByRole('status')).toHaveText('2 / 3');
  await expect(modal.getByRole('img', { name: '青玉机关 · 轮轴构形档案', exact: true })).toBeVisible();
  await page.keyboard.press('ArrowRight'); await expect(modal.getByRole('status')).toHaveText('3 / 3'); await expect(modal.getByRole('button', { name: '下一张图片', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowLeft'); await expect(modal.getByRole('status')).toHaveText('2 / 3');
  const plus = modal.getByRole('button', { name: '放大图片', exact: true }); await expect(plus).toBeEnabled();
  for (let step = 0; step < 8; step++) await plus.click();
  await expect(plus).toBeDisabled(); await expect(modal.getByRole('button', { name: '还原 300%', exact: true })).toBeEnabled();
  const pane = modal.getByRole('region', { name: '大图浏览区域', exact: true });
  expect(await pane.evaluate(element => element.scrollWidth > element.clientWidth && element.scrollHeight > element.clientHeight)).toBe(true);
  const toolbar = await modal.getByRole('group', { name: '图片预览操作', exact: true }).boundingBox(), window = page.viewportSize()!;
  expect(toolbar!.x).toBeGreaterThanOrEqual(0); expect(toolbar!.x + toolbar!.width).toBeLessThanOrEqual(window.width); expect(toolbar!.y + toolbar!.height).toBeLessThanOrEqual(window.height);
  await modal.getByRole('button', { name: '还原 300%', exact: true }).click(); await expect(modal.getByRole('button', { name: '还原 100%', exact: true })).toBeDisabled();
  await expect(plus).toBeFocused(); await page.keyboard.press('ArrowRight'); await expect(modal.getByRole('status')).toHaveText('3 / 3'); await expect(plus).toBeEnabled();
  await plus.focus(); await plus.press('Tab'); await expect(modal.getByRole('button', { name: '关闭图片预览', exact: true })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(modal).not.toBeVisible(); await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
  await trigger.click(); await expect(modal).toBeVisible();
  await page.getByRole('button', { name: '移除画廊', exact: true, includeHidden: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(page.locator('dialog')).toHaveCount(0); expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
  await page.getByRole('button', { name: '恢复画廊', exact: true }).click(); await expect(trigger).toBeEnabled();
});

test.describe('Narrow image previews', () => {
  test.use({ viewport: { width: 360, height: 600 }, hasTouch: true, isMobile: true });
  test('keeps long alternatives and 44px controls usable across materials, both reduced-motion sources and forced colors', async ({ page }) => {
    for (const profile of ['theme:light;palette:paper', 'theme:light;palette:celadon', 'theme:light;palette:gilt', 'theme:dark;palette:paper']) {
      await openStory(page, 'LongAlt', `${profile};motion:reduced`);
      const trigger = page.getByRole('button', { name: /^预览图片：/ }); await expect(trigger).toBeEnabled();
      const box = await trigger.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44);
      await trigger.click(); const modal = dialog(page); await expect(modal).toBeVisible();
      expect(await modal.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
      const plus = modal.getByRole('button', { name: '放大图片', exact: true }); await expect(plus).toBeEnabled(); await plus.click();
      for (const button of await modal.getByRole('group', { name: '图片预览操作', exact: true }).getByRole('button').all()) {
        const bounds = await button.boundingBox(); expect(bounds!.width).toBeGreaterThanOrEqual(44); expect(bounds!.height).toBeGreaterThanOrEqual(44); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
      await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    }
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' }); await openStory(page, 'Default', 'theme:light;motion:standard');
    const trigger = page.getByRole('button', { name: '预览图片：墨关 · 水墨机械档案', exact: true }); await expect(trigger).toBeEnabled(); await trigger.click();
    const modal = dialog(page); expect(await modal.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    const close = modal.getByRole('button', { name: '关闭图片预览', exact: true }); await expect(close).toBeVisible();
    await close.press('Enter'); await expect(trigger).toBeFocused();
  });
});

test('recovers from a failed original while group browsing stays available and source changes close the old modal', async ({ page }) => {
  await openStory(page, 'SourceChange'); await page.getByRole('button', { name: '载入墨关', exact: true }).click();
  const trigger = page.getByRole('button', { name: '预览图片：可重新载入的档案插图', exact: true }); await expect(trigger).toBeEnabled(); await trigger.click();
  const modal = dialog(page); await expect(modal.getByRole('button', { name: '放大图片', exact: true })).toBeEnabled();
  await modal.getByRole('button', { name: '下一张图片', exact: true }).click(); await expect(modal.getByText('原图暂未载入', { exact: true })).toBeVisible();
  await expect(modal.getByRole('button', { name: '放大图片', exact: true })).toBeDisabled();
  await modal.getByRole('button', { name: '重新载入原图', exact: true }).click(); await expect(modal.getByText('原图暂未载入', { exact: true })).toBeVisible();
  await modal.getByRole('button', { name: '下一张图片', exact: true }).click(); await expect(modal.getByRole('status')).toHaveText('3 / 3');
  await expect(modal.getByRole('button', { name: '放大图片', exact: true })).toBeEnabled(); await expect(modal.getByText('原图暂未载入', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '载入青玉机关', exact: true, includeHidden: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(modal).not.toBeVisible(); await expect(page.locator('.ui-image')).toHaveAttribute('data-state', 'loaded');
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});
