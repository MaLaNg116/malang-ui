import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

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
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json() as { entries: Record<string, StoryEntry> }).entries);
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = entries.find(entry => entry.type === 'story' && entry.title === '动效/MG 双轨等待' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Waiting sequence/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
const position = (region: Locator) => region.getByRole('slider', { name: '等待动画循环位置', exact: true });
async function cycles(region: Locator) { return Number((await region.getByText(/^自然回流：\d+ 次$/).innerText()).match(/\d+/)![0]); }
async function elapsed(region: Locator) { return await cycles(region) * 2.8 + Number(await position(region).inputValue()); }

test.describe('Waiting motion sequence', () => {
  test('crosses two real cycles, pauses, holds an exact endpoint and starts a new run through play and replay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page);
    const region = page.getByRole('region', { name: '双轨等待编排', exact: true }); const slider = position(region);
    await expect(slider).toHaveValue('0'); expect(await cycles(region)).toBe(0);
    await expect(region.getByRole('progressbar')).toHaveCount(0);
    await region.getByRole('button', { name: '播放回流', exact: true }).click();
    await expect.poll(() => cycles(region), { timeout: 12000 }).toBeGreaterThanOrEqual(2);
    await region.getByRole('button', { name: '暂停回流', exact: true }).click();
    const paused = await slider.inputValue(), heldCycles = await cycles(region);
    await page.waitForTimeout(160); await expect(slider).toHaveValue(paused); expect(await cycles(region)).toBe(heldCycles);
    await slider.fill('1.85'); await expect(region.getByText('回流 · 保持处理中', { exact: true })).toBeVisible();
    await expect(region.getByRole('button', { name: '播放回流', exact: true })).toBeVisible();
    await expect(slider).toHaveAttribute('aria-valuetext', /循环位置 1.85 秒，每周期 2.8 秒/);
    await region.getByRole('button', { name: '定位周期末', exact: true }).click();
    await expect(slider).toHaveValue('2.8'); await page.waitForTimeout(160); await expect(slider).toHaveValue('2.8');
    expect(await cycles(region)).toBe(heldCycles);
    await region.getByRole('button', { name: '播放回流', exact: true }).click();
    await expect(region.getByRole('button', { name: '暂停回流', exact: true })).toBeVisible(); expect(await cycles(region)).toBe(0);
    await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(2.8);
    await region.getByRole('button', { name: '重播回流', exact: true }).click(); expect(await cycles(region)).toBe(0);
    await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(2.8);
    await region.getByRole('button', { name: '暂停回流', exact: true }).click();
  });

  test('keeps single-cycle and reduced-motion states pending, responds to live preferences and redraws on theme and narrow resize', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'SingleCycle');
    let region = page.getByRole('region', { name: '双轨等待编排', exact: true }); let slider = position(region);
    await region.getByRole('button', { name: '播放回流', exact: true }).click();
    await expect(slider).toHaveValue('2.8'); await expect(region.getByRole('button', { name: '播放回流', exact: true })).toBeVisible();
    expect(await cycles(region)).toBe(0); await expect(region.getByText('处理中', { exact: true })).toBeVisible();
    await page.waitForTimeout(160); await expect(slider).toHaveValue('2.8');
    await region.getByRole('button', { name: '重播回流', exact: true }).click();
    await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(2.8);
    await region.getByRole('button', { name: '暂停回流', exact: true }).click();
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, 'Default', `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`);
      region = page.getByRole('region', { name: '双轨等待编排', exact: true }); slider = position(region);
      await expect(slider).toHaveValue('1.4'); expect(await cycles(region)).toBe(0);
      await expect(region.getByRole('button', { name: '查看静态处理中', exact: true })).toBeVisible();
      await slider.fill('0.35'); await expect(region.getByText('启轨 · 送出待询', { exact: true })).toBeVisible();
      await region.getByRole('button', { name: '查看静态处理中', exact: true }).click(); await expect(slider).toHaveValue('1.4');
      await region.getByRole('button', { name: '重播回流', exact: true }).click(); await page.waitForTimeout(160); await expect(slider).toHaveValue('1.4');
      await expect(region.getByRole('button', { name: '暂停回流', exact: true })).toHaveCount(0);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await region.getByRole('button', { name: '播放回流', exact: true }).click();
    await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(1.4);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(slider).toHaveValue('1.4');
    await expect(region.getByRole('button', { name: '查看静态处理中', exact: true })).toBeVisible();
    await page.waitForTimeout(160); await expect(slider).toHaveValue('1.4');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(region.getByRole('button', { name: '播放回流', exact: true })).toBeVisible(); await expect(slider).toHaveValue('1.4');
    await page.setViewportSize({ width: 360, height: 800 }); const canvas = region.getByRole('img');
    await expect.poll(() => canvas.evaluate(element => {
      const canvas = element as HTMLCanvasElement;
      return canvas.width > 0 && canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
    })).toBe(true);
    const beforeTheme = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
    await region.evaluate(element => element.closest('[data-ui-theme]')!.setAttribute('data-ui-theme', 'light'));
    await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(beforeTheme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  });

  test('isolates removal and remounting, pauses on hidden and cached pages and disposes only its own resources', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'TwoInstances');
    const first = page.getByRole('region', { name: '第一条回流', exact: true }); const second = page.getByRole('region', { name: '第二条回流', exact: true });
    await first.getByRole('button', { name: '播放回流', exact: true }).click(); await second.getByRole('button', { name: '播放回流', exact: true }).click();
    await expect.poll(() => elapsed(second)).toBeGreaterThan(.05); const beforeRemoval = await elapsed(second);
    await page.getByRole('button', { name: '移除第一条回流', exact: true }).click(); await expect(first).toHaveCount(0);
    await expect.poll(() => elapsed(second)).toBeGreaterThan(beforeRemoval);
    await page.getByRole('button', { name: '恢复第一条回流', exact: true }).click(); await expect(position(first)).toHaveValue('0'); expect(await cycles(first)).toBe(0);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expect(second.getByRole('button', { name: '播放回流', exact: true })).toBeVisible();
    const held = await position(second).inputValue(), cycle = await cycles(second);
    await page.waitForTimeout(160); await expect(position(second)).toHaveValue(held); expect(await cycles(second)).toBe(cycle);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await second.getByRole('button', { name: '播放回流', exact: true }).click();
    await expect.poll(() => elapsed(second)).toBeGreaterThan(cycle * 2.8 + Number(held));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(second.getByRole('button', { name: '播放回流', exact: true })).toBeVisible();
    const hidden = await position(second).inputValue(); await page.waitForTimeout(160); await expect(position(second)).toHaveValue(hidden);
    await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(second.getByRole('button', { name: '播放回流', exact: true })).toBeVisible();
    await second.getByRole('button', { name: '播放回流', exact: true }).click(); await expect.poll(() => elapsed(second)).toBeGreaterThan(cycle * 2.8 + Number(hidden));
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })); window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })); });
    await expect(second.getByRole('button', { name: '播放回流', exact: true })).toBeDisabled();
    await expect(second.getByText('实例已释放。', { exact: true })).toBeVisible();
    const bitmapWidth = await second.getByRole('img').evaluate(element => (element as HTMLCanvasElement).width);
    await page.setViewportSize({ width: 640, height: 600 }); await page.evaluate(() => document.fonts.dispatchEvent(new Event('loadingdone')));
    expect(await second.getByRole('img').evaluate(element => (element as HTMLCanvasElement).width)).toBe(bitmapWidth);
    await expect(position(first)).toHaveValue('0');
  });
});
