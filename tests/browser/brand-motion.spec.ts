import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    await use(errors);
    expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});

type StoryEntry = { id: string; title: string; type: string; exportName?: string };
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:dark;motion:standard') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const entries = (await response.json() as { entries: Record<string, StoryEntry> }).entries;
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(entries).find(entry => entry.type === 'story' && entry.title === '动效/MG 品牌开场' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Brand sequence/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

test.describe('MaLang brand sequence', () => {
  test('plays, pauses, seeks and skips to a stable complete wordmark, then restarts from the endpoint', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openStory(page);
    const sequence = page.getByRole('region', { name: 'MaLang 品牌开场', exact: true });
    const progress = sequence.getByRole('slider', { name: '品牌开场进度', exact: true });
    await expect(progress).toHaveValue('0');
    await expect(sequence.getByRole('status')).toHaveText('集轨 · 青玉校准');
    await sequence.getByRole('button', { name: '播放开场', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0.05);
    await sequence.getByRole('button', { name: '暂停开场', exact: true }).click();
    const paused = await progress.inputValue();
    await page.waitForTimeout(180); await expect(progress).toHaveValue(paused);
    await progress.fill('1.72');
    await expect(sequence.getByRole('status')).toHaveText('构骨 · 干墨成形');
    await sequence.getByRole('button', { name: '播放开场', exact: true }).click();
    await sequence.getByRole('button', { name: '跳过开场', exact: true }).click();
    await expect(progress).toHaveValue('4.8');
    await expect(sequence.getByRole('status')).toHaveText('定名 · MALANG UI');
    await expect(sequence.getByRole('button', { name: '播放开场', exact: true })).toBeVisible();
    const canvas = sequence.getByRole('img');
    const completed = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
    await page.waitForTimeout(180);
    await expect(progress).toHaveValue('4.8');
    expect(await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).toBe(completed);
    await sequence.getByRole('button', { name: '播放开场', exact: true }).click();
    await expect(sequence.getByRole('button', { name: '暂停开场', exact: true })).toBeVisible();
    await expect.poll(async () => Number(await progress.inputValue())).toBeLessThan(4.8);
    await sequence.getByRole('button', { name: '暂停开场', exact: true }).click();
    await progress.focus(); await progress.press('End');
    await expect(progress).toHaveValue('4.8');
    await expect(sequence.getByRole('button', { name: '播放开场', exact: true })).toBeVisible();
    await sequence.getByRole('button', { name: '重播开场', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0);
    await expect.poll(async () => Number(await progress.inputValue())).toBeLessThan(4.8);
    await sequence.getByRole('button', { name: '暂停开场', exact: true }).click();
  });

  test('starts with the complete static identity for both preference sources and updates system preference, theme and narrow layout', async ({ page }) => {
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, 'Default', `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const sequence = page.getByRole('region', { name: 'MaLang 品牌开场', exact: true });
      const progress = sequence.getByRole('slider', { name: '品牌开场进度', exact: true });
      await expect(progress).toHaveValue('4.8');
      await expect(sequence.getByRole('status')).toHaveText('定名 · MALANG UI');
      await progress.fill('1.2');
      await expect(sequence.getByRole('status')).toHaveText('构骨 · 干墨成形');
      await sequence.getByRole('button', { name: '查看完整字标', exact: true }).click();
      await expect(progress).toHaveValue('4.8');
      await sequence.getByRole('button', { name: '重播开场', exact: true }).click();
      await page.waitForTimeout(150); await expect(progress).toHaveValue('4.8');
      await expect(sequence.getByRole('button', { name: '暂停开场', exact: true })).toHaveCount(0);
    }
    const sequence = page.getByRole('region', { name: 'MaLang 品牌开场', exact: true });
    const progress = sequence.getByRole('slider', { name: '品牌开场进度', exact: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await sequence.getByRole('button', { name: '播放开场', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(progress).toHaveValue('4.8');
    const canvas = sequence.getByRole('img');
    const dark = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
    await page.locator('.kit-story-surface').evaluate(element => element.setAttribute('data-ui-theme', 'light'));
    await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(dark);
    await expect(progress).toHaveValue('4.8');
    await page.setViewportSize({ width: 360, height: 800 });
    await expect.poll(() => canvas.evaluate(element => {
      const canvas = element as HTMLCanvasElement;
      return canvas.width > 0 && canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('keeps another instance alive after removal and preserves a paused timeline across cached-page, fonts and visibility events', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openStory(page, 'TwoInstances');
    const first = page.getByRole('region', { name: '第一组品牌开场', exact: true });
    const second = page.getByRole('region', { name: '第二组品牌开场', exact: true });
    const progress = second.getByRole('slider', { name: '品牌开场进度', exact: true });
    await first.getByRole('button', { name: '播放开场', exact: true }).click();
    await second.getByRole('button', { name: '播放开场', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0.05);
    const beforeRemoval = Number(await progress.inputValue());
    await page.getByRole('button', { name: '移除第一组开场', exact: true }).click();
    await expect(first).toHaveCount(0);
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(beforeRemoval);
    await page.getByRole('button', { name: '恢复第一组开场', exact: true }).click();
    await expect(first.getByRole('slider')).toHaveValue('0');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expect(second.getByRole('button', { name: '播放开场', exact: true })).toBeVisible();
    const held = await progress.inputValue();
    await page.waitForTimeout(150); await expect(progress).toHaveValue(held);
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); document.fonts.dispatchEvent(new Event('loadingdone')); });
    await expect(progress).toHaveValue(held);
    await second.getByRole('button', { name: '播放开场', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(Number(held));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(second.getByRole('button', { name: '播放开场', exact: true })).toBeVisible();
    const hidden = await progress.inputValue();
    await page.waitForTimeout(150); await expect(progress).toHaveValue(hidden);
    await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
    await second.getByRole('button', { name: '播放开场', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(Number(hidden));
    await second.getByRole('button', { name: '暂停开场', exact: true }).click();
    await expect(first.getByRole('slider')).toHaveValue('0');
  });
});
