import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); }); await use(errors); expect(errors).toEqual([]); }, { auto: true }],
});
async function openStory(page: Page, name = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = entries.find(item => item.type === 'story' && item.title === '反馈组件/Popconfirm 气泡确认' && (item.exportName === name || item.id.endsWith(`--${suffix}`))); expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function clockStory(page: Page) { await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') }); await openStory(page, 'AsyncConfirmation'); await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z')); }

test.describe('Popover confirmation', () => {
  test('uses native actions without trapping focus and leaves declined controlled requests retryable', async ({ page }) => {
    await openStory(page);
    const trigger = page.getByRole('button', { name: '归档卷宗', exact: true }), dialog = page.getByRole('dialog', { name: '确认归档这份卷宗？', exact: true });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog'); await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus(); await trigger.press('Enter'); await expect(dialog).toBeVisible();
    await expect(dialog).not.toHaveAttribute('aria-modal', 'true'); await expect(dialog.getByRole('button', { name: '保留草稿', exact: true })).toBeFocused();
    await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    await trigger.click(); await expect(dialog).toBeVisible(); await expect(trigger).toBeFocused();
    await trigger.press('Tab'); await expect(dialog.getByRole('button', { name: '保留草稿', exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(dialog.getByRole('button', { name: '确认归档', exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); const outside = page.getByRole('textbox', { name: '确认气泡外的草稿', exact: true }); await expect(outside).toBeFocused();
    await outside.click(); await expect(dialog).toBeHidden(); await expect(outside).toBeFocused(); await outside.fill('外部编辑继续保留');
    await trigger.click(); await dialog.getByRole('button', { name: '确认归档', exact: true }).click(); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    await expect(outside).toHaveValue('外部编辑继续保留'); await expect(page.locator('[data-popconfirm-result]')).toHaveText('确认：1；取消：2');

    await openStory(page, 'Controlled');
    const controlledTrigger = page.getByRole('button', { name: '请求确认归档', exact: true }), controlled = page.getByRole('dialog', { name: '受控确认归档？', exact: true });
    await controlledTrigger.focus(); await controlledTrigger.press('Enter'); await expect(controlled).toBeHidden();
    await expect(page.locator('[data-popconfirm-controlled]')).toHaveText('请求：1；确认：0；取消：0；父模型：false');
    const editor = page.getByRole('textbox', { name: '受控确认外的草稿', exact: true }); await editor.focus();
    await page.getByRole('button', { name: '程序打开确认', exact: true }).evaluate(element => (element as HTMLButtonElement).click()); await expect(controlled).toBeVisible(); await expect(editor).toBeFocused();
    await page.getByRole('button', { name: '程序关闭确认', exact: true }).evaluate(element => (element as HTMLButtonElement).click()); await expect(controlled).toBeHidden(); await expect(editor).toBeFocused();
    await page.getByRole('switch', { name: '接受打开请求', exact: true }).check();
    await controlledTrigger.focus(); await controlledTrigger.press('Enter'); await expect(controlled).toBeVisible();
    const cancel = controlled.getByRole('button', { name: '取消受控归档', exact: true }); await expect(cancel).toBeFocused();
    await cancel.click(); await expect(controlled).toBeVisible(); await cancel.click(); await expect(controlled).toBeVisible();
    await expect(page.locator('[data-popconfirm-controlled]')).toHaveText('请求：4；确认：0；取消：2；父模型：true');
    await page.getByRole('switch', { name: '接受关闭请求', exact: true }).evaluate(element => (element as HTMLInputElement).click());
    await cancel.click(); await expect(controlled).toBeHidden(); await expect(controlledTrigger).toBeFocused();
    await page.getByRole('switch', { name: '禁用气泡确认', exact: true }).check(); await expect(controlledTrigger).toBeDisabled();
    const requests = await page.locator('[data-popconfirm-controlled]').innerText();
    await controlledTrigger.evaluate(element => (element as HTMLButtonElement).click()); await expect(controlled).toBeHidden(); await expect(page.locator('[data-popconfirm-controlled]')).toHaveText(requests);
  });

  test('coalesces async confirmation, preserves false or rejected outcomes and retains external editing focus on success', async ({ page }) => {
    await clockStory(page);
    const strategy = page.getByRole('combobox', { name: '确认策略', exact: true }), trigger = page.getByRole('button', { name: '提交校对', exact: true });
    const dialog = page.getByRole('dialog', { name: '提交这次校对？', exact: true }), confirm = dialog.getByRole('button', { name: '确认提交', exact: true }), cancel = dialog.getByRole('button', { name: '取消提交', exact: true });
    await strategy.selectOption('error'); await trigger.click(); await expect(dialog).toBeVisible(); await confirm.focus();
    await confirm.evaluate(element => { element.dispatchEvent(new MouseEvent('click', { bubbles: true })); element.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await expect(confirm).toBeDisabled(); await expect(confirm).toHaveAttribute('aria-busy', 'true'); await expect(cancel).toBeFocused();
    await expect(confirm.locator('.ui-spinner')).toHaveAttribute('aria-hidden', 'true'); await expect(dialog.getByRole('status')).toHaveText('正在确认，请稍候。');
    await expect(page.locator('[data-popconfirm-async]')).toContainText('尝试：1；确认：0');
    await page.clock.runFor(1199); await expect(confirm).toBeDisabled(); await expect(dialog.getByRole('alert')).toHaveCount(0);
    await page.clock.runFor(1); await expect(dialog.getByRole('alert')).toHaveText('本地校对暂未完成，请重试。'); await expect(confirm).toBeEnabled();
    await expect(dialog).toBeVisible(); await expect(page.locator('[data-popconfirm-async]')).toContainText('错误：1');
    await cancel.click(); await strategy.selectOption('deny'); await trigger.click(); await confirm.click(); await page.clock.runFor(1200);
    await expect(dialog).toBeVisible(); await expect(confirm).toBeEnabled(); await expect(dialog.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('[data-popconfirm-async]')).toContainText('尝试：2；确认：0');
    await cancel.click(); await strategy.selectOption('success'); await trigger.click(); await confirm.click(); await expect(cancel).toBeFocused();
    await cancel.press('Tab'); const unmount = page.getByRole('button', { name: '卸载确认组件', exact: true }); await expect(unmount).toBeFocused();
    await unmount.press('Tab'); const outside = page.getByRole('textbox', { name: '异步确认外的草稿', exact: true }); await expect(outside).toBeFocused(); await outside.fill('确认期间继续写');
    await page.clock.runFor(1200); await expect(dialog).toBeHidden(); await expect(outside).toBeFocused(); await expect(outside).toHaveValue('确认期间继续写');
    await expect(page.locator('[data-popconfirm-async]')).toContainText('尝试：3；确认：1'); await expect(page.locator('[data-popconfirm-async]')).toContainText('错误：1；事件：click');
  });

  test('ignores a cancelled operation during a new request and releases an unmounted confirmation before remounting', async ({ page }) => {
    await clockStory(page);
    const trigger = page.getByRole('button', { name: '提交校对', exact: true }), dialog = page.getByRole('dialog', { name: '提交这次校对？', exact: true });
    const confirm = dialog.getByRole('button', { name: '确认提交', exact: true });
    await page.getByRole('combobox', { name: '确认策略', exact: true }).selectOption('late');
    await trigger.click(); await confirm.click(); await page.clock.runFor(400); await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    await expect(page.locator('[data-popconfirm-async]')).toContainText('中止：1');
    await page.getByRole('combobox', { name: '确认策略', exact: true }).selectOption('success');
    await trigger.click(); await confirm.click(); await page.clock.runFor(800);
    await expect(dialog).toBeVisible(); await expect(confirm).toBeDisabled(); await expect(page.locator('[data-popconfirm-async]')).toContainText('尝试：2；确认：0；取消：1');
    await page.clock.runFor(399); await expect(confirm).toBeDisabled(); await page.clock.runFor(1); await expect(dialog).toBeHidden();
    await expect(page.locator('[data-popconfirm-async]')).toContainText('尝试：2；确认：1');
    await trigger.click(); await confirm.click(); await page.clock.runFor(300); const retired = await dialog.elementHandle();
    await page.getByRole('button', { name: '卸载确认组件', exact: true }).evaluate(element => (element as HTMLButtonElement).click()); await expect(page.locator('.ui-popconfirm')).toHaveCount(0);
    expect(await retired!.evaluate(element => ({ connected: element.isConnected, open: element.matches(':popover-open') }))).toEqual({ connected: false, open: false });
    await page.setViewportSize({ width: 760, height: 620 }); await page.clock.runFor(2000); await expect(page.locator('[data-popconfirm-async]')).toContainText('尝试：3；确认：1'); await expect(page.locator('[data-popconfirm-async]')).toContainText('错误：0'); await expect(page.locator('[data-popconfirm-async]')).toContainText('中止：2'); await retired!.dispose();
    await page.getByRole('button', { name: '挂载确认组件', exact: true }).click(); await trigger.focus(); await trigger.press('Enter'); await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
    await expect(page.locator('[data-popconfirm-async]')).toContainText('取消：2');
    await trigger.click(); await confirm.click(); await page.clock.runFor(1200); await expect(dialog).toBeHidden(); await expect(page.locator('[data-popconfirm-async]')).toContainText('尝试：4；确认：2');
  });

  test('keeps long dangerous confirmations scrollable and their actions visible at 360px in both themes and reduction modes', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 420 }, isMobile: true, hasTouch: true }); const page = await context.newPage(), errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      for (const theme of ['light', 'dark']) for (const source of ['container', 'system']) {
        await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
        await openStory(page, 'EdgeAndLongContent', `theme:${theme};motion:${source === 'container' ? 'reduced' : 'standard'}`);
        const trigger = page.getByRole('button', { name: '检查长记录', exact: true }), dialog = page.getByRole('dialog', { name: '移除长名称记录？', exact: true });
        await trigger.focus(); await trigger.press('Enter'); await expect(dialog).toBeVisible();
        const cancel = dialog.getByRole('button', { name: '保留长记录', exact: true }), confirm = dialog.getByRole('button', { name: '确认移除长记录', exact: true });
        await expect(cancel).toBeFocused(); await expect(cancel).toBeInViewport(); await expect(confirm).toBeInViewport();
        const box = await dialog.boundingBox(), viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, height: innerHeight }));
        expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + .5); expect(box!.y).toBeGreaterThanOrEqual(0); expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + .5);
        for (const action of [cancel, confirm]) { const bounds = await action.boundingBox(); expect(bounds!.width).toBeGreaterThanOrEqual(44); expect(bounds!.height).toBeGreaterThanOrEqual(44); }
        expect(await dialog.locator('.ui-popconfirm__copy').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
        expect(await dialog.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
        const paint = await confirm.evaluate(element => { const style = getComputedStyle(element), hex = style.getPropertyValue('--ui-color-danger').trim(); return { actual: getComputedStyle(element.querySelector('.ui-button__surface')!).backgroundColor, expected: `rgb(${hex.slice(1).match(/../g)!.map(value => parseInt(value, 16)).join(', ')})` }; });
        expect(paint.actual).toBe(paint.expected); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
        await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
      }
      await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' }); await openStory(page, 'Danger');
      await page.getByRole('button', { name: '移除记录', exact: true }).click(); const dialog = page.getByRole('dialog', { name: '移除这份本地记录？', exact: true }); await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
      await dialog.getByRole('button', { name: '保留记录', exact: true }).click(); await expect(dialog).toBeHidden(); expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
