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
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '二级组件/DropdownMenu 操作菜单' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `DropdownMenu/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

test.describe('Dropdown menu', () => {
  test('opens first or last, loops around disabled items and separators, selects once and restores its trigger', async ({ page }) => {
    await openStory(page);
    const trigger = page.getByRole('button', { name: '打开档案菜单', exact: true });
    const menu = page.getByRole('menu', { name: '档案操作', exact: true });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus(); await trigger.press('ArrowUp');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('id', (await trigger.getAttribute('aria-controls'))!);
    await expect(menu.getByRole('separator')).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: '归入旧卷', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: '编辑档案', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: '复制副本', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: '导出文件', exact: true })).toBeDisabled();
    await expect(menu.getByRole('menuitem', { name: '归入旧卷', exact: true })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(menu.getByRole('menuitem', { name: '编辑档案', exact: true })).toBeFocused();
    await page.keyboard.press('End');
    await expect(menu.getByRole('menuitem', { name: '归入旧卷', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('已选择：archive');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.press('Space');
    await expect(menu.getByRole('menuitem', { name: '编辑档案', exact: true })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('已选择：edit');
    await expect(trigger).toBeFocused();
  });

  test('finds typed prefixes, closes on Escape and continues native Tab order in both directions', async ({ page }) => {
    await openStory(page, 'KeyboardSearch');
    const trigger = page.getByRole('button', { name: '打开档案菜单', exact: true });
    const menu = page.getByRole('menu', { name: '档案操作', exact: true });
    await trigger.focus(); await trigger.press('ArrowDown');
    await page.keyboard.press('d');
    await expect(menu.getByRole('menuitem', { name: 'Duplicate', exact: true })).toBeFocused();
    await page.keyboard.press('e');
    await expect(menu.getByRole('menuitem', { name: 'Delete', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden(); await expect(trigger).toBeFocused();
    await trigger.press('Enter');
    await page.keyboard.press('Tab');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: '菜单后一项', exact: true })).toBeFocused();
    await trigger.focus(); await trigger.press('ArrowDown');
    await page.keyboard.press('Shift+Tab');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: '菜单前一项', exact: true })).toBeFocused();
    await trigger.click();
    const outside = page.getByRole('textbox', { name: '菜单外部输入框', exact: true });
    await outside.click();
    await expect(menu).toBeHidden(); await expect(outside).toBeFocused();
  });

  test('keeps disabled and empty menus safe and leaves no focus intent after a refused controlled request', async ({ page }) => {
    await openStory(page, 'Disabled');
    const disabled = page.getByRole('button', { name: '打开档案菜单', exact: true });
    await expect(disabled).toBeDisabled();
    await disabled.evaluate(element => (element as HTMLButtonElement).click());
    await expect(page.getByRole('menu')).toBeHidden();
    await openStory(page, 'AllDisabled');
    const trigger = page.getByRole('button', { name: '打开档案菜单', exact: true });
    await trigger.focus(); await trigger.press('Enter');
    await expect(page.getByRole('menu')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menu')).toBeFocused();
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await openStory(page, 'Empty');
    await trigger.click();
    await expect(page.getByRole('menu').getByText('暂无可用操作', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();

    await openStory(page, 'Controlled');
    const controlled = page.getByRole('button', { name: '请求打开受控菜单', exact: true });
    const menu = page.getByRole('menu', { name: '受控档案操作', exact: true });
    const outside = page.getByRole('textbox', { name: '受控菜单外部输入框', exact: true });
    await controlled.focus(); await controlled.press('Enter');
    await expect(page.getByTestId('menu-requests')).toHaveText('更新请求：1 次');
    await expect(menu).toBeHidden();
    await outside.focus();
    await page.getByRole('button', { name: '程序打开菜单', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(menu).toBeVisible(); await expect(outside).toBeFocused();
    await controlled.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: '编辑档案', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('menu-requests')).toHaveText('更新请求：2 次');
    await expect(menu).toBeVisible();
    await outside.focus();
    await page.getByRole('button', { name: '程序关闭菜单', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(menu).toBeHidden(); await expect(outside).toBeFocused();
  });

  test('keeps a long cut-frame menu scrollable inside a small viewport and stops reduced-motion feedback', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 340 });
    await openStory(page, 'LongContent', 'theme:dark;motion:reduced');
    const trigger = page.getByRole('button', { name: '打开长清单', exact: true });
    await trigger.focus(); await trigger.press('ArrowDown');
    const menu = page.getByRole('menu', { name: '长清单', exact: true });
    await expect(menu).toBeVisible();
    await expect.poll(() => menu.evaluate(element => { const rect = element.getBoundingClientRect(); return rect.left >= 0 && rect.top >= 0 && rect.right <= document.documentElement.clientWidth && rect.bottom <= document.documentElement.clientHeight; })).toBe(true);
    expect(await menu.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    await page.keyboard.press('End');
    const last = menu.getByRole('menuitem', { name: '最后一份档案', exact: true });
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    const sizes = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(sizes.scroll).toBe(sizes.viewport);
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await menu.evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
  });

  test('cleans an open instance and a pending typeahead buffer before a fresh mount', async ({ page }) => {
    await openStory(page, 'UnmountCleanup');
    const trigger = page.getByRole('button', { name: '打开可卸载菜单', exact: true });
    const firstId = await trigger.getAttribute('aria-controls');
    await trigger.focus(); await trigger.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('e');
    await page.getByRole('button', { name: '卸载菜单', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(page.locator(`[id="${firstId}"]`)).toHaveCount(0);
    await page.setViewportSize({ width: 430, height: 620 });
    await page.getByRole('button', { name: '重新挂载菜单', exact: true }).click();
    await expect(trigger).not.toHaveAttribute('aria-controls', firstId!);
    await trigger.focus(); await trigger.press('Enter');
    await expect(page.getByRole('menuitem', { name: '编辑档案', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden(); await expect(trigger).toBeFocused();
  });
});
