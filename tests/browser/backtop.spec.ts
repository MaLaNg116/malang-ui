import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

declare global {
  interface Window { __backtopAudit: { counts(): number[]; calls: { target: string; behavior: string | undefined; css: string; immediate: number }[] } }
}
const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); }); await use(errors); expect(errors).toEqual([]); }, { auto: true }],
});
async function openStory(page: Page, name: string, globals = 'theme:dark;motion:standard', title = '基础组件/BackTop 返回顶部') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const entry = entries.find(item => item.type === 'story' && item.title === title && (item.exportName === name || item.id.endsWith(`--${suffix}`))); expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const registrations = new WeakMap<EventTarget, Set<EventListenerOrEventListenerObject>>();
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // Storybook also observes these containers with a non-passive listener.
      // Audit the component's explicit passive subscription contract separately.
      if (type === 'scroll' && listener && typeof options === 'object' && options?.passive === true && this instanceof HTMLElement && this.hasAttribute('data-backtop-target')) { const list = registrations.get(this) ?? new Set(); list.add(listener); registrations.set(this, list); }
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function(type, listener, options) { if (type === 'scroll' && listener) registrations.get(this)?.delete(listener); return remove.call(this, type, listener, options); };
    window.__backtopAudit = { counts: () => [...document.querySelectorAll('[data-backtop-target]')].map(target => registrations.get(target)?.size ?? 0), calls: [] };
    const scroll = Element.prototype.scrollTo;
    Element.prototype.scrollTo = function(...args: [options?: ScrollToOptions] | [x: number, y: number]) {
      Reflect.apply(scroll, this, args);
      if (this instanceof HTMLElement && this.hasAttribute('data-backtop-target')) window.__backtopAudit.calls.push({ target: this.getAttribute('data-backtop-target')!, behavior: typeof args[0] === 'object' ? args[0]?.behavior : undefined, css: getComputedStyle(this).scrollBehavior, immediate: this.scrollTop });
    };
  });
}
const scrollElement = (page: Page, target: 'a' | 'b', top: number) => page.locator(`[data-backtop-target="${target}"]`).evaluate((element, position) => element.scrollTo({ top: position, behavior: 'instant' }), top);

test.describe('Space layout and BackTop navigation', () => {
  test('uses the window threshold, retains keyboard focus after returning, and preserves direct-child spacing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'WindowDefault');
    const back = page.getByRole('button', { name: '返回顶部', exact: true }); await expect(back).toHaveCount(0);
    await page.evaluate(() => window.scrollTo({ top: 399, behavior: 'instant' })); await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(399); await expect(back).toHaveCount(0);
    await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'instant' })); await expect(back).toBeVisible();
    const bounds = await back.boundingBox(); expect(bounds!.width).toBeGreaterThanOrEqual(44); expect(bounds!.height).toBeGreaterThanOrEqual(44);
    await back.focus(); await back.press('Enter'); await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(back).toBeFocused(); await expect(back).toBeVisible();
    await page.getByRole('heading', { name: '长卷浏览', exact: true }).click(); await expect(back).toHaveCount(0);
    await openStory(page, 'GapAndAlignment', 'theme:light;motion:standard', '基础组件/Space 间距');
    const zero = page.locator('[data-space-case="zero"]'); await expect(zero.locator(':scope > button')).toHaveCount(2); expect(await zero.getAttribute('role')).toBeNull();
    for (const [sample, gap] of [['small', 8], ['zero', 0], ['custom', 18], ['large', 20]] as const) {
      const measured = await page.locator(`[data-space-case="${sample}"]`).evaluate(element => { const children = [...element.children].map(child => child.getBoundingClientRect()); return children[1]!.left - children[0]!.right; });
      expect(measured).toBeCloseTo(gap, 1);
    }
    expect(await page.locator('[data-space-case="custom"]').evaluate(element => getComputedStyle(element).display)).toBe('inline-flex');
  });

  test('isolates actual scroll targets and removes old subscriptions when the getter changes or the control unmounts', async ({ page }) => {
    await instrument(page); await openStory(page, 'ScrollContainer');
    const aBack = page.getByRole('button', { name: '返回甲卷顶部', exact: true }), bBack = page.getByRole('button', { name: '返回乙卷顶部', exact: true });
    await expect.poll(() => page.evaluate(() => window.__backtopAudit.counts())).toEqual([1, 1]);
    await scrollElement(page, 'a', 119); await expect(aBack).toHaveCount(0); await expect(bBack).toHaveCount(0);
    await scrollElement(page, 'a', 380); await expect(aBack).toBeVisible(); await expect(bBack).toHaveCount(0);
    await scrollElement(page, 'b', 300); await expect(bBack).toBeVisible();
    await aBack.focus(); await aBack.press('Space'); await expect.poll(() => page.locator('[data-backtop-target="a"]').evaluate(element => element.scrollTop)).toBe(0);
    expect(await page.locator('[data-backtop-target="b"]').evaluate(element => element.scrollTop)).toBe(300); await expect(aBack).toBeFocused(); await expect(aBack).toBeVisible();
    await expect(page.locator('[data-backtop-clicks]')).toHaveText('甲卷回顶请求：1');
    await page.getByRole('button', { name: '继续整理附件', exact: true }).click(); await expect(aBack).toHaveCount(0); await expect(bBack).toBeVisible();

    await openStory(page, 'TargetLifecycle'); const current = page.getByRole('button', { name: '返回当前卷顶部', exact: true });
    await expect.poll(() => page.evaluate(() => window.__backtopAudit.counts())).toEqual([1, 0]);
    await scrollElement(page, 'a', 380); await expect(current).toBeVisible();
    await page.getByRole('button', { name: '监测乙卷', exact: true }).click(); await expect(current).toHaveCount(0); await expect.poll(() => page.evaluate(() => window.__backtopAudit.counts())).toEqual([0, 1]);
    await scrollElement(page, 'a', 0); await scrollElement(page, 'a', 380); await expect(current).toHaveCount(0);
    await scrollElement(page, 'b', 380); await expect(current).toBeVisible();
    await page.getByRole('button', { name: '卸载返回控件', exact: true }).click(); await expect.poll(() => page.evaluate(() => window.__backtopAudit.counts())).toEqual([0, 0]);
    await scrollElement(page, 'b', 0); await scrollElement(page, 'b', 380); await expect(current).toHaveCount(0);
    await page.getByRole('button', { name: '挂载返回控件', exact: true }).click(); await expect(current).toBeVisible(); await expect.poll(() => page.evaluate(() => window.__backtopAudit.counts())).toEqual([0, 1]);
    await current.focus(); await current.press('Enter'); await expect(page.locator('[data-backtop-life-clicks]')).toHaveText('回顶请求：1');
    await expect(current).toBeFocused(); await expect(current).toBeVisible();
    await page.getByRole('button', { name: '等待滚动目标', exact: true }).click(); await expect(current).toHaveCount(0); await expect.poll(() => page.evaluate(() => window.__backtopAudit.counts())).toEqual([0, 0]);
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' })); await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400); await expect(current).toHaveCount(0);
  });

  test('uses real instant scrolling over CSS smooth for both reduced-motion sources at 360px and keeps a forced-color glyph', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true }); const page = await context.newPage(), errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      await instrument(page);
      for (const theme of ['light', 'dark']) for (const source of ['container', 'system']) {
        await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
        await openStory(page, source === 'container' ? 'ReducedMotion' : 'ScrollContainer', `theme:${theme};motion:${source === 'container' ? 'reduced' : 'standard'}`);
        await scrollElement(page, 'a', 380); const back = page.getByRole('button', { name: '返回甲卷顶部', exact: true }); await expect(back).toBeVisible();
        const box = await back.boundingBox(); expect(box!.width).toBe(44); expect(box!.height).toBe(44); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(360);
        await page.evaluate(() => { window.__backtopAudit.calls.length = 0; }); await back.click();
        expect(await page.evaluate(() => window.__backtopAudit.calls)).toEqual([{ target: 'a', behavior: 'instant', css: 'smooth', immediate: 0 }]);
        expect(await page.locator('[data-backtop-target="a"]').evaluate(element => element.scrollTop)).toBe(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
      }
      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' }); await openStory(page, 'ScrollContainer'); await scrollElement(page, 'a', 380);
      const back = page.getByRole('button', { name: '返回甲卷顶部', exact: true }); await expect(back).toBeVisible();
      expect(await back.locator('svg path').evaluate(element => getComputedStyle(element).stroke)).not.toBe('none');
      expect(await back.evaluate(element => getComputedStyle(element, '::before').backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
      await expect(back).toHaveAccessibleName('返回甲卷顶部');
      await page.emulateMedia({ forcedColors: 'none' }); await openStory(page, 'Wrapping', 'theme:light;motion:standard', '基础组件/Space 间距');
      await expect(page.locator('.ui-space > button')).toHaveCount(4);
      expect(await page.locator('.ui-space > button').evaluateAll(elements => elements.every(element => element.getBoundingClientRect().left >= 0 && element.getBoundingClientRect().right <= 360))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360); expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
