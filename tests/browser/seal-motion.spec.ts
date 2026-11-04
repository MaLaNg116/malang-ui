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
  const story = Object.values(entries).find(entry => entry.type === 'story' && entry.title === '动效/MG 成功落印' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Seal sequence/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
test.describe('Seal motion sequence', () => {
  test('plays, pauses, seeks to the impression and restarts a stopped endpoint through its public controls', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openStory(page);
    const sequence = page.getByRole('region', { name: '成功落印编排', exact: true });
    const progress = sequence.getByRole('slider', { name: '落印动画进度', exact: true });
    await expect(progress).toHaveValue('0');
    await expect(sequence.getByText('蓄印 · 滑轨聚合', { exact: true })).toBeVisible();
    await sequence.getByRole('button', { name: '播放落印', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0.05);
    await sequence.getByRole('button', { name: '暂停落印', exact: true }).click();
    const paused = await progress.inputValue();
    await page.waitForTimeout(180);
    await expect(progress).toHaveValue(paused);
    await progress.fill('2.12');
    await expect(progress).toHaveValue('2.12');
    await expect(sequence.getByText('落印 · 朱砂成形', { exact: true })).toBeVisible();
    await sequence.getByRole('button', { name: '定位成章', exact: true }).click();
    await expect(progress).toHaveValue('3.6');
    await expect(sequence.getByRole('button', { name: '播放落印', exact: true })).toBeVisible();
    await expect(sequence.getByText('回响 · 成章归位', { exact: true })).toBeVisible();
    await page.waitForTimeout(180);
    await expect(progress).toHaveValue('3.6');
    await sequence.getByRole('button', { name: '重播落印', exact: true }).click();
    await expect(sequence.getByRole('button', { name: '暂停落印', exact: true })).toBeVisible();
    await expect.poll(async () => Number(await progress.inputValue())).toBeLessThan(3.6);
    await sequence.getByRole('button', { name: '暂停落印', exact: true }).click();
  });

  test('uses a static completed impression for both preference sources and responds to a live system change', async ({ page }) => {
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, 'Default', `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const sequence = page.getByRole('region', { name: '成功落印编排', exact: true });
      const progress = sequence.getByRole('slider', { name: '落印动画进度', exact: true });
      await expect(progress).toHaveValue('3.6');
      await expect(sequence.getByRole('button', { name: '查看静态落印', exact: true })).toBeVisible();
      await progress.fill('1.2');
      await expect(sequence.getByText('合轨 · 印面校准', { exact: true })).toBeVisible();
      await sequence.getByRole('button', { name: '查看静态落印', exact: true }).click();
      await expect(progress).toHaveValue('3.6');
      await sequence.getByRole('button', { name: '重播落印', exact: true }).click();
      await page.waitForTimeout(150);
      await expect(progress).toHaveValue('3.6');
      await expect(sequence.getByRole('button', { name: '暂停落印', exact: true })).toHaveCount(0);
    }
    const sequence = page.getByRole('region', { name: '成功落印编排', exact: true });
    const progress = sequence.getByRole('slider', { name: '落印动画进度', exact: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await sequence.getByRole('button', { name: '播放落印', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(progress).toHaveValue('3.6');
    await expect(sequence.getByRole('button', { name: '查看静态落印', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    await expect.poll(() => sequence.getByRole('img').evaluate(element => {
      const canvas = element as HTMLCanvasElement;
      return canvas.width > 0 && canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
    })).toBe(true);
    const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(geometry.scroll).toBe(geometry.viewport);
  });

  test('isolates a removed instance and holds its surviving timeline across hidden and cached-page lifecycles', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openStory(page, 'TwoInstances');
    const first = page.getByRole('region', { name: '第一枚印记', exact: true });
    const second = page.getByRole('region', { name: '第二枚印记', exact: true });
    const secondProgress = second.getByRole('slider', { name: '落印动画进度', exact: true });
    await first.getByRole('button', { name: '播放落印', exact: true }).click();
    await second.getByRole('button', { name: '播放落印', exact: true }).click();
    await expect.poll(async () => Number(await secondProgress.inputValue())).toBeGreaterThan(0.05);
    const beforeRemoval = Number(await secondProgress.inputValue());
    await page.getByRole('button', { name: '移除第一枚印记', exact: true }).click();
    await expect(first).toHaveCount(0);
    await expect.poll(async () => Number(await secondProgress.inputValue())).toBeGreaterThan(beforeRemoval);
    await page.getByRole('button', { name: '恢复第一枚印记', exact: true }).click();
    await expect(first.getByRole('slider')).toHaveValue('0');
    await expect(second.getByRole('button', { name: '暂停落印', exact: true })).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expect(second.getByRole('button', { name: '播放落印', exact: true })).toBeVisible();
    const held = await secondProgress.inputValue();
    await page.waitForTimeout(150);
    await expect(secondProgress).toHaveValue(held);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await second.getByRole('button', { name: '播放落印', exact: true }).click();
    await expect.poll(async () => Number(await secondProgress.inputValue())).toBeGreaterThan(Number(held));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(second.getByRole('button', { name: '播放落印', exact: true })).toBeVisible();
    const hidden = await secondProgress.inputValue();
    await page.waitForTimeout(150);
    await expect(secondProgress).toHaveValue(hidden);
    await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
    await second.getByRole('button', { name: '播放落印', exact: true }).click();
    await expect.poll(async () => Number(await secondProgress.inputValue())).toBeGreaterThan(Number(hidden));
    await second.getByRole('button', { name: '暂停落印', exact: true }).click();
    await expect(first.getByRole('slider')).toHaveValue('0');
  });
});
