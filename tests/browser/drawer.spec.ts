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
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '二级组件/Drawer 抽屉' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function scrollState(page: Page) { return page.evaluate(() => ({ root: getComputedStyle(document.documentElement).overflow, body: getComputedStyle(document.body).overflow })); }
async function noPageOverflow(page: Page) { const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })); expect(geometry.scroll).toBe(geometry.viewport); }

test.describe('Drawer', () => {
  test('contains the native modal keyboard sequence, returns to its trigger and preserves editing between openings', async ({ page }) => {
    await openStory(page);
    const before = await scrollState(page);
    const trigger = page.getByRole('button', { name: '展开档案侧卷', exact: true });
    await trigger.focus(); await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: '档案侧卷', exact: true });
    await expect(drawer).toBeVisible(); await expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(await drawer.evaluate(element => element.matches(':modal'))).toBe(true);
    const name = drawer.getByRole('textbox', { name: '档案名称', exact: true });
    await expect(name).toBeFocused(); await name.fill('侧卷内的编辑');
    const first = drawer.getByRole('button', { name: '关闭抽屉', exact: true });
    const last = drawer.getByRole('button', { name: '保存侧卷', exact: true });
    await last.focus(); await page.keyboard.press('Tab'); await expect(first).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(last).toBeFocused();
    await trigger.evaluate(element => element.focus());
    expect(await drawer.evaluate(element => element.contains(element.ownerDocument.activeElement))).toBe(true);
    await page.keyboard.press('Escape'); await expect(drawer).toBeHidden(); await expect(trigger).toBeFocused(); expect(await scrollState(page)).toEqual(before);
    await trigger.click(); await expect(name).toHaveValue('侧卷内的编辑'); await last.click();
    await expect(drawer).toBeHidden(); await expect(trigger).toBeFocused(); await expect(page.getByRole('status')).toHaveText('「侧卷内的编辑」已保存。');
  });

  test('keeps default backdrop gestures deliberate and honors explicit dismissal policies', async ({ page }) => {
    await openStory(page); await page.getByRole('button', { name: '展开档案侧卷', exact: true }).click();
    const defaultDrawer = page.getByRole('dialog', { name: '档案侧卷', exact: true });
    await page.mouse.click(8, 8); await expect(defaultDrawer).toBeVisible(); await page.keyboard.press('Escape'); await expect(defaultDrawer).toBeHidden();
    await openStory(page, 'BackdropDismiss');
    await page.getByRole('button', { name: '展开阅读侧卷', exact: true }).click();
    const reading = page.getByRole('dialog', { name: '阅读侧卷', exact: true });
    const bodyBox = await reading.locator('.ui-dialog__body').boundingBox(); expect(bodyBox).toBeTruthy();
    await page.mouse.move(bodyBox!.x + bodyBox!.width / 2, bodyBox!.y + bodyBox!.height / 2); await page.mouse.down(); await page.mouse.move(8, 8); await page.mouse.up(); await expect(reading).toBeVisible();
    await page.mouse.click(8, 8); await expect(reading).toBeHidden();
    await openStory(page, 'ClosePolicy');
    const trigger = page.getByRole('button', { name: '展开关闭策略示例', exact: true }); await trigger.click();
    const explicit = page.getByRole('dialog', { name: '完成当前检查', exact: true });
    await page.keyboard.press('Escape'); await page.mouse.click(8, 8); await expect(explicit).toBeVisible();
    await explicit.getByRole('button', { name: '关闭抽屉', exact: true }).click(); await expect(explicit).toBeHidden(); await expect(trigger).toBeFocused();
  });

  test('keeps long copy scrollable and the header and actions reachable on narrow and short screens', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 480 });
    for (const theme of ['light', 'dark']) {
      await openStory(page, 'LongContent', `theme:${theme};motion:reduced`); await page.getByRole('button', { name: '展开长卷', exact: true }).click();
      const drawer = page.getByRole('dialog', { name: '山川档案长卷', exact: true });
      const box = await drawer.boundingBox(); expect(box).toBeTruthy(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(360); expect(box!.y + box!.height).toBeLessThanOrEqual(480);
      expect(await drawer.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
      const body = drawer.locator('.ui-dialog__body'); expect(await body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
      await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
      await expect(body.getByText('卷末：每一步都能安然归位。', { exact: true })).toBeInViewport();
      await expect(drawer.getByRole('button', { name: '关闭抽屉', exact: true })).toBeInViewport();
      const close = drawer.getByRole('button', { name: '合上长卷', exact: true }); await expect(close).toBeInViewport(); await noPageOverflow(page); await close.click(); await expect(drawer).toBeHidden();
    }
    await openStory(page, 'Bottom', 'theme:dark;motion:reduced'); await page.getByRole('button', { name: '展开档案侧卷', exact: true }).click();
    const bottom = page.getByRole('dialog', { name: '档案侧卷', exact: true }); await expect(bottom.getByRole('button', { name: '保存侧卷', exact: true })).toBeInViewport();
    const bottomBox = await bottom.boundingBox(); expect(bottomBox!.y).toBeGreaterThanOrEqual(0); expect(bottomBox!.y + bottomBox!.height).toBeLessThanOrEqual(480); await noPageOverflow(page);
  });

  test('closes only the top modal and clears nested locks and focus when the drawer is unmounted', async ({ page }) => {
    await openStory(page, 'NestedAndUnmount');
    const before = await scrollState(page); const trigger = page.getByRole('button', { name: '打开嵌套抽屉', exact: true }); await trigger.click();
    const drawer = page.getByRole('dialog', { name: '侧卷设置', exact: true }); const innerTrigger = drawer.getByRole('button', { name: '打开补充说明', exact: true }); await innerTrigger.click();
    const inner = page.getByRole('dialog', { name: '补充说明', exact: true }); await expect(inner).toBeVisible();
    await page.keyboard.press('Escape'); await expect(inner).toBeHidden(); await expect(drawer).toBeVisible(); await expect(innerTrigger).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden' || getComputedStyle(document.body).overflow === 'hidden')).toBe(true);
    await innerTrigger.click(); await inner.getByRole('button', { name: '卸载整个侧卷', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(trigger).toBeFocused(); expect(await scrollState(page)).toEqual(before);
    await trigger.click(); await expect(drawer).toBeVisible(); await expect(inner).toBeHidden(); await drawer.getByRole('button', { name: '关闭侧卷设置', exact: true }).click(); await expect(drawer).toBeHidden(); await expect(trigger).toBeFocused(); expect(await scrollState(page)).toEqual(before);
  });
});
