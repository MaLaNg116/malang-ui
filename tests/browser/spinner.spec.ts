import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); }); await use(errors); expect(errors).toEqual([]); }, { auto: true }],
});
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:dark;motion:standard') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); const entry = entries.find(item => item.type === 'story' && item.title === '基础组件/Spinner 加载标记' && (item.exportName === exportedName || item.id.endsWith(`--${suffix}`))); expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
const motionLayers = '.ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core';
async function samplePhase(visual: Locator, phase: number) {
  // Skip the first two local cycles so positive segment delays have all started.
  await visual.evaluate((element, time) => element.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = time; }), 4800 + phase);
}
async function rotation(element: Locator) {
  return element.evaluate(element => { const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform); return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI; });
}

test.describe('Mechanical loading marker', () => {
  test('keeps all sizes stable through four staggered corner releases, a shared lock and a counter-turning core', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'Sizes');
    const markers = page.getByRole('status'); await expect(markers).toHaveCount(3);
    for (const [index, size] of [16, 24, 32].entries()) {
      const marker = markers.nth(index), visual = marker.locator('svg');
      await expect(visual).toHaveCount(1); await expect(visual).toHaveAttribute('aria-hidden', 'true'); await expect(visual).toHaveAttribute('focusable', 'false');
      await expect(visual.locator('.ui-spinner__assembly')).toHaveCount(1); await expect(visual.locator('.ui-spinner__arm')).toHaveCount(4); await expect(visual.locator('.ui-spinner__segment')).toHaveCount(4); await expect(visual.locator('.ui-spinner__core')).toHaveCount(1); await expect(visual.locator(motionLayers)).toHaveCount(6);
      const box = await marker.boundingBox(); expect(box!.width).toBe(size); expect(box!.height).toBe(size);
      await expect.poll(() => visual.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(6);
      const rootBefore = await marker.boundingBox();
      // Release edges, delay offsets, core rest and the full outer revolution.
      const boundsPhases = new Set([0, 600, 1200, 1800, 2400, 3000, 3600, 4200, 4799]);
      for (const offset of [0, 2400]) {
        for (const delay of [0, 100, 200, 300]) for (const frame of [0, 288, 672, 912, 1392, 2399]) if (offset + delay + frame < 4800) boundsPhases.add(offset + delay + frame);
        for (const frame of [0, 336, 1080, 2399]) boundsPhases.add(offset + frame);
      }
      for (const phase of [...boundsPhases].sort((left, right) => left - right)) {
        await samplePhase(visual, phase);
        expect(await marker.boundingBox()).toEqual(rootBefore);
        expect(await visual.evaluate(element => { const bounds = element.getBoundingClientRect(), paths = [...element.querySelectorAll('path')]; return paths.length >= 5 && paths.every(path => { const box = path.getBoundingClientRect(); return box.left >= bounds.left - .5 && box.right <= bounds.right + .5 && box.top >= bounds.top - .5 && box.bottom <= bounds.bottom + .5; }); })).toBe(true);
      }
      const angles: number[] = [];
      for (const phase of [300, 600, 900]) { await samplePhase(visual, phase); angles.push(await rotation(visual.locator('.ui-spinner__assembly'))); }
      expect(angles[1]! - angles[0]!).toBeCloseTo(22.5, 1); expect(angles[2]! - angles[1]!).toBeCloseTo(22.5, 1);
      await samplePhase(visual, 600);
      expect(new Set(await visual.locator('.ui-spinner__segment').evaluateAll(elements => elements.map(element => getComputedStyle(element).transform))).size).toBeGreaterThan(1);
      expect(await visual.locator('.ui-spinner__segment').evaluateAll(elements => elements.some(element => !new DOMMatrixReadOnly(getComputedStyle(element).transform).isIdentity))).toBe(true);
      expect(await rotation(visual.locator('.ui-spinner__core'))).toBeLessThan(-1);
      for (const phase of [1700, 1800, 2000, 2399]) {
        await samplePhase(visual, phase);
        expect(await visual.locator('.ui-spinner__segment').evaluateAll(elements => elements.every(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).isIdentity))).toBe(true);
        const core = await visual.locator('.ui-spinner__core').evaluate(element => { const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform); return { a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, e: matrix.e, f: matrix.f }; });
        expect(core.a).toBeCloseTo(-1, 5); expect(core.d).toBeCloseTo(-1, 5); expect(core.b).toBeCloseTo(0, 5); expect(core.c).toBeCloseTo(0, 5); expect(core.e).toBeCloseTo(0, 5); expect(core.f).toBeCloseTo(0, 5);
      }
      expect(await visual.locator('.ui-spinner__arm').evaluateAll(elements => elements.map(element => element.getAttribute('transform')))).toEqual(['rotate(0 24 24)', 'rotate(90 24 24)', 'rotate(180 24 24)', 'rotate(270 24 24)']);
    }
    await openStory(page); await expect(page.getByRole('status')).toHaveText('加载中'); await expect(page.getByText('加载中', { exact: true })).toHaveCount(1); await expect(page.locator('.ui-spinner input,.ui-spinner button,.ui-spinner [tabindex]')).toHaveCount(0);
  });

  test('stops all six motion layers for either reduced-motion source and retains a clear forced-color mechanism', async ({ page }) => {
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' }); await openStory(page, 'Default', `theme:${source === 'system' ? 'dark' : 'light'};motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const visual = page.getByRole('status').locator('svg'); expect(await visual.evaluate(element => getComputedStyle(element).animationName)).toBe('none'); expect(await visual.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
      await expect(visual.locator(motionLayers)).toHaveCount(6);
      expect(await visual.locator(motionLayers).evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none' && getComputedStyle(element).transform === 'none'))).toBe(true);
      await expect(visual.locator('.ui-spinner__arm')).toHaveCount(4); expect(new Set(await visual.locator('.ui-spinner__arm').evaluateAll(elements => elements.map(element => getComputedStyle(element).transform))).size).toBe(4);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' }); await openStory(page);
    const visual = page.getByRole('status').locator('svg'); expect(await visual.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(visual.locator(motionLayers)).toHaveCount(6);
    expect(await visual.locator(motionLayers).evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none' && getComputedStyle(element).transform === 'none'))).toBe(true);
    expect(await visual.locator('path').evaluateAll(elements => elements.every(element => { const style = getComputedStyle(element); return (style.stroke !== 'none' || style.fill !== 'none') && style.opacity !== '0'; }))).toBe(true);
    await expect(page.getByRole('status')).toHaveText('加载中');
  });

  test('shows user-controlled busy feedback in a 44px touch button with one parent message and no request', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true }); const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      await openStory(page, 'BusyRegion'); await page.waitForLoadState('networkidle'); const requests: string[] = []; page.on('request', request => requests.push(request.url()));
      const region = page.getByRole('region', { name: '设计档案列表', exact: true }); await expect(region).toHaveAttribute('aria-busy', 'false');
      const start = page.getByRole('button', { name: '开始整理', exact: true }); const size = await start.boundingBox(); expect(size!.height).toBeGreaterThanOrEqual(44);
      await start.click(); await expect(region).toHaveAttribute('aria-busy', 'true'); await expect(page.getByRole('status')).toHaveCount(1); await expect(page.getByRole('status')).toHaveText('本地档案正在整理。');
      await expect(page.locator('.ui-spinner')).toHaveAttribute('aria-hidden', 'true'); await expect(page.getByText('本地档案正在整理。', { exact: true })).toHaveCount(1);
      const retired = await page.locator('.ui-spinner').evaluateHandle(element => element);
      await page.getByRole('button', { name: '完成整理', exact: true }).click(); await expect(region).toHaveAttribute('aria-busy', 'false'); await expect(page.getByRole('status')).toHaveText('本地档案已准备好。');
      await expect(page.getByRole('button', { name: '再次整理', exact: true })).toBeFocused(); await expect.poll(() => retired.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0); await retired.dispose();
      expect(requests).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360); expect(errors).toEqual([]);
      await openStory(page, 'MechanismDetail');
      await expect(page.getByRole('status')).toHaveCount(4);
      for (const label of ['档案载入中', '校准中', '连接中']) {
        const button = page.getByRole('button', { name: label, exact: true });
        await expect(button).toBeDisabled(); await expect(button).toHaveAttribute('aria-busy', 'true'); await expect(button).toHaveAccessibleName(label);
        const spinner = button.locator('.ui-spinner'); await expect(spinner).toHaveCount(1); await expect(spinner).toHaveAttribute('aria-hidden', 'true');
        await expect(spinner.locator('svg')).toHaveCount(1); await expect(spinner.locator('.ui-spinner__core')).toHaveCount(1);
        const textColor = await button.evaluate(element => getComputedStyle(element).color);
        expect(await spinner.evaluate(element => getComputedStyle(element).color)).toBe(textColor);
        expect(await spinner.locator('.ui-spinner__core').evaluate(element => getComputedStyle(element).color)).toBe(textColor);
        await expect(button.getByRole('status')).toHaveCount(0);
      }
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
