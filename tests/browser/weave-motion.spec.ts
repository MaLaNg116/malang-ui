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
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:light;palette:paper;motion:standard') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = (await response.json() as { entries: Record<string, StoryEntry> }).entries;
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(entries).find(entry => entry.type === 'story' && entry.title === '动效/MG 经纬织光' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Weave sequence/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function frame(canvas: Locator) {
  return canvas.evaluate(element => {
    const canvas = element as HTMLCanvasElement, data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (let index = 0; index < data.length; index += 28) for (let channel = 0; channel < 4; channel++) hash = Math.imul(hash ^ data[index + channel]!, 16777619);
    return hash >>> 0;
  });
}

test.describe('Weave motion sequence', () => {
  test('plays and pauses real threads, seeks a static detail and stops at the geometric weave before replay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page);
    const sequence = page.getByRole('region', { name: '经纬织光编排', exact: true });
    const progress = sequence.getByRole('slider', { name: '经纬织光进度', exact: true });
    await expect(progress).toHaveValue('0');
    await expect(sequence.getByRole('status')).toHaveText('铺经 · 细轨列阵');
    await sequence.getByRole('button', { name: '播放经纬', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0.05);
    await sequence.getByRole('button', { name: '暂停经纬', exact: true }).click();
    const held = await progress.inputValue(); await page.waitForTimeout(180); await expect(progress).toHaveValue(held);
    await progress.fill('2.4'); await expect(sequence.getByRole('status')).toHaveText('织光 · 经纬交错');
    await progress.focus(); await progress.press('End');
    await expect(progress).toHaveValue('4.2');
    await expect(sequence.getByRole('status')).toHaveText('归序 · 织印成面');
    await expect(sequence.getByRole('button', { name: '播放经纬', exact: true })).toBeVisible();
    const canvas = sequence.getByRole('img'), complete = await frame(canvas);
    await page.waitForTimeout(180); expect(await frame(canvas)).toBe(complete); await expect(progress).toHaveValue('4.2');
    await sequence.getByRole('button', { name: '播放经纬', exact: true }).click();
    await expect(sequence.getByRole('button', { name: '暂停经纬', exact: true })).toBeVisible();
    await expect.poll(async () => Number(await progress.inputValue())).toBeLessThan(4.2);
    await sequence.getByRole('button', { name: '定位织印', exact: true }).click(); await expect(progress).toHaveValue('4.2');
    await sequence.getByRole('button', { name: '重播经纬', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0);
    await expect.poll(async () => Number(await progress.inputValue())).toBeLessThan(4.2);
    await sequence.getByRole('button', { name: '暂停经纬', exact: true }).click();
  });

  test('supports both reduction sources, live system changes and three mounted light palettes while retaining vermilion cuts', async ({ page }) => {
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, 'Default', `theme:light;palette:paper;motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const sequence = page.getByRole('region', { name: '经纬织光编排', exact: true }), progress = sequence.getByRole('slider', { name: '经纬织光进度', exact: true });
      await expect(progress).toHaveValue('4.2'); await expect(sequence.getByRole('status')).toHaveText('归序 · 织印成面');
      await progress.fill('1.2'); await expect(sequence.getByRole('status')).toHaveText('穿纬 · 墨线往来');
      await sequence.getByRole('button', { name: '查看静态织印', exact: true }).click(); await expect(progress).toHaveValue('4.2');
      await sequence.getByRole('button', { name: '重播经纬', exact: true }).click();
      await page.waitForTimeout(150); await expect(progress).toHaveValue('4.2');
      await expect(sequence.getByRole('button', { name: '暂停经纬', exact: true })).toHaveCount(0);
    }
    const sequence = page.getByRole('region', { name: '经纬织光编排', exact: true }), progress = sequence.getByRole('slider', { name: '经纬织光进度', exact: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await sequence.getByRole('button', { name: '播放经纬', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(progress).toHaveValue('4.2');
    const canvas = sequence.getByRole('img'), frames: number[] = [];
    for (const palette of ['paper', 'celadon', 'gilt']) {
      const before = await frame(canvas);
      await page.locator('.kit-story-surface').evaluate((element, value) => element.setAttribute('data-ui-palette', value), palette);
      if (palette !== 'paper') await expect.poll(() => frame(canvas)).not.toBe(before);
      frames.push(await frame(canvas));
      const cut = await canvas.evaluate(element => {
        const canvas = element as HTMLCanvasElement, style = getComputedStyle(canvas), box = canvas.getBoundingClientRect();
        const unit = Math.min(box.width / 760, box.height / 440), ratio = canvas.width / box.width;
        // Sample the centre of the upper vermilion register cut, outside the silk.
        const actual = Array.from(canvas.getContext('2d')!.getImageData(Math.floor((box.width / 2 - 223 * unit) * ratio), Math.floor((box.height / 2 - 111 * unit) * ratio), 1, 1).data);
        const sample = canvas.ownerDocument.createElement('canvas'); sample.width = sample.height = 1;
        const context = sample.getContext('2d')!; context.fillStyle = style.getPropertyValue('--ui-color-seal').trim(); context.fillRect(0, 0, 1, 1);
        return { actual, expected: Array.from(context.getImageData(0, 0, 1, 1).data) };
      });
      expect(cut.actual[3]).toBeGreaterThan(240);
      for (let channel = 0; channel < 3; channel++) expect(Math.abs(cut.actual[channel]! - cut.expected[channel]!)).toBeLessThanOrEqual(2);
      expect(cut.expected[0]).toBeGreaterThan(cut.expected[1]!); expect(cut.expected[0]).toBeGreaterThan(cut.expected[2]!);
      await expect(progress).toHaveValue('4.2');
    }
    expect(new Set(frames).size).toBe(3);
    await page.locator('.kit-story-surface').evaluate(element => element.setAttribute('data-ui-theme', 'dark'));
    await expect.poll(() => frame(canvas)).not.toBe(frames[2]);
    await page.setViewportSize({ width: 360, height: 800 });
    await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).width > 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('isolates removal and keeps a paused instance through cached-page, font, DPR and hidden-page changes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'TwoInstances');
    const first = page.getByRole('region', { name: '第一幅经纬', exact: true }), second = page.getByRole('region', { name: '第二幅经纬', exact: true });
    const progress = second.getByRole('slider', { name: '经纬织光进度', exact: true });
    await first.getByRole('button', { name: '播放经纬', exact: true }).click(); await second.getByRole('button', { name: '播放经纬', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0.05);
    const before = Number(await progress.inputValue());
    await page.getByRole('button', { name: '移除第一幅经纬', exact: true }).click(); await expect(first).toHaveCount(0);
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(before);
    await page.getByRole('button', { name: '恢复第一幅经纬', exact: true }).click(); await expect(first.getByRole('slider')).toHaveValue('0');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expect(second.getByRole('button', { name: '播放经纬', exact: true })).toBeVisible();
    const held = await progress.inputValue(); await page.waitForTimeout(150); await expect(progress).toHaveValue(held);
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); document.fonts.dispatchEvent(new Event('loadingdone')); });
    await expect(progress).toHaveValue(held);
    const client = await page.context().newCDPSession(page);
    // A DPR-only same-size CDP override changes getters without delivering media
    // or resize events. Change the actual viewport too, as browser zoom does.
    await client.send('Emulation.setDeviceMetricsOverride', { width: 1260, height: 740, deviceScaleFactor: 1.5, mobile: false });
    await expect.poll(() => page.evaluate(() => devicePixelRatio)).toBe(1.5);
    await expect.poll(() => page.evaluate(() => matchMedia('(resolution: 1.5dppx)').matches)).toBe(true);
    for (const sequence of [first, second]) {
      const canvas = sequence.getByRole('img');
      const expected = await canvas.evaluate(element => { const box = element.getBoundingClientRect(); return { width: Math.round(box.width * 1.5), height: Math.round(box.height * 1.5) }; });
      await expect.poll(() => canvas.evaluate(element => ({ width: (element as HTMLCanvasElement).width, height: (element as HTMLCanvasElement).height }))).toEqual(expected);
    }
    await client.detach(); await expect(progress).toHaveValue(held);
    await second.getByRole('button', { name: '播放经纬', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(Number(held));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(second.getByRole('button', { name: '播放经纬', exact: true })).toBeVisible();
    const hidden = await progress.inputValue(); await page.waitForTimeout(150); await expect(progress).toHaveValue(hidden);
    await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
    await second.getByRole('button', { name: '播放经纬', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(Number(hidden));
    await second.getByRole('button', { name: '暂停经纬', exact: true }).click(); await expect(first.getByRole('slider')).toHaveValue('0');
  });
});
