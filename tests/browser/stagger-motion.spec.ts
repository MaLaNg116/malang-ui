import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if ((message.type() === 'warning' && message.text().includes('[Vue warn]')) || /GSAP target.*not found/.test(message.text())) errors.push(message.text()); });
    await use(errors); expect(errors).toEqual([]);
  }, { auto: true }],
});
type StoryEntry = { id: string; title: string; type: string; exportName?: string };
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:dark;motion:standard') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json() as { entries: Record<string, StoryEntry> }).entries);
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = entries.find(entry => entry.type === 'story' && entry.title === '动效/DOM 清单归位' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Stagger/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
function scene(page: Page, name = '归档清单入场') { return page.getByRole('region', { name, exact: true }); }
function progress(region: Locator) { return region.getByRole('slider', { name: '入场动画进度', exact: true }); }
function item(region: Locator, index: number) { return region.locator(`[data-stagger-item="${index}"]`); }
async function appearance(target: Locator) { return target.evaluate(element => {
  const styles = getComputedStyle(element), matrix = new DOMMatrixReadOnly(styles.transform === 'none' ? undefined : styles.transform);
  const inline = (element as HTMLElement).style;
  return { x: matrix.e, y: matrix.f, opacity: Number(styles.opacity), inlineTransform: inline.transform, transformPriority: inline.getPropertyPriority('transform'), inlineTranslate: inline.translate, inlineOpacity: inline.opacity, opacityPriority: inline.getPropertyPriority('opacity'), color: inline.color };
}); }
async function frames(page: Page) { await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); }

test.describe('DOM stagger entry', () => {
  test('starts readable, applies actual staggered movement and returns authored transforms and unrelated styles on completion/disposal', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page);
    const region = scene(page), slider = progress(region), first = item(region, 0), second = item(region, 1);
    await expect(region).toHaveAttribute('data-phase', 'idle'); await expect(slider).toHaveValue('0');
    const baseline = await appearance(first), secondBaseline = await appearance(second); expect(baseline.opacity).toBe(.88); expect(baseline.opacityPriority).toBe('important'); expect(secondBaseline.opacity).toBe(1);
    await region.getByRole('button', { name: '校验容器独占', exact: true }).click();
    await expect(region.locator('[data-ownership]')).toContainText('already belongs to another sequence');
    await slider.fill('0.04'); await slider.fill('0');
    const initial = await appearance(first); expect(initial.y - baseline.y).toBeCloseTo(18, 3); expect(initial.opacity).toBe(0);
    expect((await appearance(second)).opacity).toBe(0);
    await slider.fill('0.06');
    const entering = await appearance(first); expect(entering.y).toBeGreaterThan(baseline.y); expect(entering.y).toBeLessThan(initial.y); expect(entering.opacity).toBeGreaterThan(0);
    expect((await appearance(second)).opacity).toBe(0);
    await region.getByRole('button', { name: '播放入场', exact: true }).click();
    await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(.1);
    await region.getByRole('button', { name: '暂停入场', exact: true }).click();
    const held = await slider.inputValue(); await frames(page); await expect(slider).toHaveValue(held);
    await slider.fill('0.58'); await expect(region).toHaveAttribute('data-phase', 'settled');
    expect(await appearance(first)).toEqual(baseline);
    expect(await appearance(second)).toEqual(secondBaseline);
    await first.evaluate(element => { (element as HTMLElement).style.color = 'rgb(10, 20, 30)'; });
    await slider.fill('0.1');
    await region.getByRole('button', { name: '释放编排', exact: true }).click();
    await expect(region).toHaveAttribute('data-disposed', 'true');
    const disposed = await appearance(first); expect(disposed.inlineTransform).toBe(baseline.inlineTransform); expect(disposed.inlineOpacity).toBe(baseline.inlineOpacity); expect(disposed.color).toBe('rgb(10, 20, 30)');
    await expect(slider).toBeDisabled();
    await region.getByRole('button', { name: '重新创建编排', exact: true }).click(); await expect(region).toHaveAttribute('data-phase', 'idle');
    await region.getByRole('button', { name: '校验容器独占', exact: true }).click(); await expect(region.locator('[data-ownership]')).toContainText('already belongs');
  });

  test('supports opposite spatial directions and keeps focused form content readable through replay and backwards seek', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'Directions');
    const left = scene(page, '左域归位'), right = scene(page, '右域归位');
    const leftBaseline = await appearance(item(left, 0)), rightBaseline = await appearance(item(right, 0));
    for (const region of [left, right]) { await progress(region).fill('0.01'); await progress(region).fill('0'); }
    expect((await appearance(item(left, 0))).x - leftBaseline.x).toBeCloseTo(36, 3);
    expect((await appearance(item(right, 0))).x - rightBaseline.x).toBeCloseTo(-36, 3);
    await left.getByRole('button', { name: '释放编排', exact: true }).click();
    expect(await appearance(item(left, 0))).toEqual(leftBaseline); expect((await appearance(item(right, 0))).opacity).toBe(0);

    await openStory(page);
    const region = scene(page), slider = progress(region), field = region.getByRole('textbox', { name: '归档清单入场内容备注', exact: true });
    await slider.fill('0.01'); await slider.fill('0'); expect((await appearance(item(region, 2))).opacity).toBe(0);
    await field.focus(); await expect(field).toBeFocused(); await expect(slider).toHaveValue('0.58');
    for (const index of [0, 1, 2]) expect((await appearance(item(region, index))).opacity).toBeGreaterThan(.8);
    await field.fill('正在填写，重播不打断。');
    await region.getByRole('button', { name: '重播入场', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await slider.evaluate(element => { const input = element as HTMLInputElement; input.value = '0'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(field).toBeFocused(); await expect(field).toHaveValue('正在填写，重播不打断。'); await expect(slider).toHaveValue('0.58');
    expect(await field.getAttribute('aria-hidden')).toBeNull();
    await openStory(page, 'FocusSafety');
    const focused = scene(page, '正在填写的归档'); await expect(progress(focused)).toHaveValue('0.58'); await expect(focused).toHaveAttribute('data-phase', 'settled');
    await expect(focused.getByRole('textbox')).toBeFocused();
  });

  test('keeps independent instances alive and settles page visibility/BFCache transitions before safe unmount/remount', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'TwoInstances');
    const first = scene(page, '第一组清单'), second = scene(page, '第二组清单');
    await first.getByRole('button', { name: '播放入场', exact: true }).click(); await second.getByRole('button', { name: '播放入场', exact: true }).click();
    await expect.poll(async () => Number(await progress(second).inputValue())).toBeGreaterThan(.05);
    const before = Number(await progress(second).inputValue());
    await page.getByRole('button', { name: '移除第一组清单', exact: true }).click(); await expect(first).toHaveCount(0);
    await expect.poll(async () => Number(await progress(second).inputValue())).toBeGreaterThan(before);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expect(progress(second)).toHaveValue('1.6'); await expect(second).toHaveAttribute('data-playing', 'false');
    expect((await appearance(item(second, 1))).opacity).toBe(1);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await second.getByRole('button', { name: '播放入场', exact: true }).click(); await expect(second).toHaveAttribute('data-playing', 'true');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(progress(second)).toHaveValue('1.6'); await expect(second).toHaveAttribute('data-phase', 'settled');
    await frames(page); await expect(progress(second)).toHaveValue('1.6');
    await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
    await page.getByRole('button', { name: '恢复第一组清单', exact: true }).click(); await expect(first).toHaveAttribute('data-phase', 'idle');
    await second.getByRole('button', { name: '重播入场', exact: true }).click(); await expect(second).toHaveAttribute('data-playing', 'true');
    await expect(first).toHaveAttribute('data-phase', 'idle');
    await second.getByRole('button', { name: '释放编排', exact: true }).click();
  });

  test('handles empty sets and both reduced-motion sources without hidden content or mobile overflow', async ({ page }) => {
    await openStory(page, 'Empty'); const empty = scene(page, '空清单编排');
    await expect(empty).toHaveAttribute('data-time', '0'); await expect(empty).toHaveAttribute('data-phase', 'settled'); await expect(progress(empty)).toBeDisabled();
    await empty.getByRole('button', { name: '播放入场', exact: true }).click(); await empty.getByRole('button', { name: '重播入场', exact: true }).click();
    await empty.getByRole('button', { name: '校验容器独占', exact: true }).click(); await expect(empty.locator('[data-ownership]')).toContainText('空集合可安全创建');
    await expect(empty).not.toContainText('NaN'); await page.setViewportSize({ width: 360, height: 800 });
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, 'Default', `theme:${source === 'system' ? 'dark' : 'light'};motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const region = scene(page), slider = progress(region); await expect(slider).toHaveValue('0.58');
      await region.getByRole('button', { name: '查看静态清单', exact: true }).click(); await region.getByRole('button', { name: '重播入场', exact: true }).click();
      await slider.fill('0.1'); await expect(slider).toHaveValue('0.58');
      for (const index of [0, 1, 2]) expect((await appearance(item(region, index))).opacity).toBeGreaterThan(.8);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' }); const region = scene(page);
    await region.getByRole('button', { name: '播放入场', exact: true }).click(); await expect(region).toHaveAttribute('data-playing', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(progress(region)).toHaveValue('0.58');
    await expect(region).toHaveAttribute('data-playing', 'false'); expect((await appearance(item(region, 1))).opacity).toBe(1);
  });
});
