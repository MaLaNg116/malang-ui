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
async function openForge(page: Page, theme = 'light') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '开始/铸刃工坊' && (entry.exportName === 'Default' || entry.id.endsWith('--default')));
  expect(story, 'The release forge story exists').toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=theme:${theme};motion:reduced`);
  await expect(page.getByRole('heading', { name: '理卷、淬炼， 一印成章。', level: 1, exact: true })).toBeVisible();
}
async function openTimedForge(page: Page, theme = 'light') {
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await openForge(page, theme);
  await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z'));
}
async function expectNoPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}
async function expectInsideViewport(surface: Locator) {
  await expect.poll(() => surface.evaluate(element => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.top >= 0 && box.right <= element.ownerDocument.documentElement.clientWidth && box.bottom <= element.ownerDocument.documentElement.clientHeight;
  }), { message: 'The editor or action menu stays within the visible viewport' }).toBe(true);
}

test.describe('Release forge', () => {
  test('edits through a keyboard menu, validates the drawer and completes three distinct stages with one final announcement', async ({ page }) => {
    await openTimedForge(page);
    const trigger = page.getByRole('button', { name: '工坊操作', exact: true });
    await trigger.focus(); await trigger.press('ArrowDown');
    const menu = page.getByRole('menu', { name: '工坊操作', exact: true });
    const edit = menu.getByRole('menuitem', { name: '编辑交付资料…', exact: true });
    await expect(edit).toBeFocused();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: '交付资料', exact: true });
    await expect(menu).toBeHidden();
    await expect(drawer).toBeVisible();
    const name = drawer.getByRole('textbox', { name: '组件包名称', exact: true });
    const version = drawer.getByRole('textbox', { name: '版本标识', exact: true });
    await expect(name).toBeFocused();
    await name.fill(''); await version.fill('');
    await drawer.getByRole('button', { name: '保存资料', exact: true }).click();
    await expect(drawer.getByRole('alert')).toHaveCount(2);
    await expect(drawer.getByRole('alert').filter({ hasText: '请填写组件包名称。' })).toBeVisible();
    await expect(drawer.getByRole('alert').filter({ hasText: '请填写版本标识。' })).toBeVisible();
    await expect(name).toBeFocused();
    await name.fill('山川组件'); await version.fill('0.2.0-forge');
    await drawer.getByRole('textbox', { name: '交付说明', exact: true }).fill('本轮校准机械刻线、卷页和交付动效。');
    await drawer.getByRole('button', { name: '保存资料', exact: true }).click();
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    const archive = page.getByRole('region', { name: '交付档案', exact: true });
    await expect(archive).toContainText('山川组件');
    await expect(archive).toContainText('0.2.0-forge');
    await expect(archive).toContainText('本轮校准机械刻线、卷页和交付动效。');
    await expect(page.getByRole('group', { name: '资料已保存', exact: true })).toContainText('山川组件 · 0.2.0-forge 已更新。');
    await expect(page.getByRole('status').filter({ hasText: '资料已保存' })).toHaveCount(1);

    const progress = page.getByRole('progressbar', { name: '交付准备度', exact: true });
    const steps = page.getByRole('group', { name: '交付流程', exact: true });
    const timeline = page.getByRole('region', { name: '工坊运行记录', exact: true });
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(steps.getByRole('button')).toHaveCount(0);
    await page.getByRole('button', { name: '开始检查', exact: true }).click();
    await expect(page.getByRole('button', { name: '检查进行中', exact: true })).toBeDisabled();
    await expect(trigger).toBeDisabled();
    await expect(timeline.getByRole('heading', { name: '理卷 · 整理交付资料', exact: true })).toHaveCount(1);
    await expect(steps.locator('[aria-current="step"]')).toContainText('理卷');
    await page.clock.runFor(700);
    await expect(progress).toHaveAttribute('aria-valuenow', '33');
    await expect(steps.locator('[aria-current="step"]')).toContainText('淬炼');
    await expect(timeline.getByRole('listitem').filter({ hasText: '理卷 · 整理交付资料' })).toContainText('已完成');
    await page.clock.runFor(700);
    await expect(progress).toHaveAttribute('aria-valuenow', '67');
    await expect(steps.locator('[aria-current="step"]')).toContainText('落印');
    await expect(timeline.getByRole('listitem').filter({ hasText: '淬炼 · 逐项校准状态' })).toContainText('已完成');
    await page.clock.runFor(700);
    await expect(progress).toHaveAttribute('aria-valuenow', '100');
    await expect(progress).toHaveAttribute('aria-valuetext', '100%，已完成');
    await expect(page.getByRole('button', { name: '重新检查', exact: true })).toBeEnabled();
    await expect(trigger).toBeEnabled();
    await expect(timeline.getByRole('listitem')).toHaveCount(4);
    await expect(timeline.getByRole('heading', { name: '落印 · 记录交付结果', exact: true })).toHaveCount(1);
    await expect(timeline.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('group', { name: '落印完成', exact: true })).toContainText('山川组件 · 0.2.0-forge 本地演练已完成。');
    await expect(page.getByRole('status').filter({ hasText: '落印完成' })).toHaveCount(1);
    await expect(page.getByRole('alert').filter({ hasText: '落印完成' })).toHaveCount(0);
  });

  test('coalesces repeated starts, stops a cancelled timer and recovers from a persistent second-stage failure', async ({ page }) => {
    await openTimedForge(page, 'dark');
    const progress = page.getByRole('progressbar', { name: '交付准备度', exact: true });
    const timeline = page.getByRole('region', { name: '工坊运行记录', exact: true });
    // Native synchronous activations reach the handler before Vue patches loading/disabled.
    await page.getByRole('button', { name: '开始检查', exact: true }).evaluate(element => {
      const button = element as HTMLButtonElement; button.click(); button.click(); button.click();
    });
    await expect(timeline.getByRole('listitem')).toHaveCount(2);
    await page.clock.runFor(700);
    await expect(progress).toHaveAttribute('aria-valuenow', '33');
    await expect(timeline.getByRole('listitem')).toHaveCount(3);
    await page.getByRole('button', { name: '取消检查', exact: true }).click();
    await expect(page.getByRole('button', { name: '重新检查', exact: true })).toBeEnabled();
    await expect(timeline.getByText('本次检查已取消，可重新开始。', { exact: true })).toBeVisible();
    await page.clock.runFor(5_000);
    await expect(progress).toHaveAttribute('aria-valuenow', '33');
    await expect(timeline.getByRole('listitem')).toHaveCount(3);
    await expect(page.getByRole('group', { name: '落印完成', exact: true })).toHaveCount(0);

    const fault = page.getByRole('checkbox', { name: '演示异常分支', exact: true });
    await fault.check();
    await page.getByRole('button', { name: '重新检查', exact: true }).click();
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await page.clock.runFor(700); await expect(progress).toHaveAttribute('aria-valuenow', '33');
    await page.clock.runFor(700); await expect(progress).toHaveAttribute('aria-valuenow', '67');
    await expect(progress).toHaveAttribute('aria-valuetext', '67%，发生错误');
    await expect(page.getByRole('group', { name: '交付流程', exact: true }).locator('[aria-current="step"]')).toContainText('当前步骤，出现错误');
    await expect(timeline.getByRole('listitem').filter({ hasText: '淬炼 · 逐项校准状态' }).last()).toContainText('异常');
    const errorToast = page.getByRole('group', { name: '检查需要修正', exact: true });
    await expect(errorToast).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: '检查需要修正' })).toHaveCount(1);
    await page.clock.runFor(3_000);
    await expect(errorToast).toBeVisible();
    await expect(progress).toHaveAttribute('aria-valuenow', '67');
    await expect(timeline.getByRole('listitem')).toHaveCount(5);
    await expect(timeline.getByRole('heading', { name: '落印 · 记录交付结果', exact: true })).toHaveCount(0);

    await fault.uncheck();
    await page.getByRole('button', { name: '重新检查', exact: true }).click();
    for (const value of ['33', '67', '100']) { await page.clock.runFor(700); await expect(progress).toHaveAttribute('aria-valuenow', value); }
    await expect(page.getByRole('group', { name: '落印完成', exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '落印完成' })).toHaveCount(1);
    await expect(page.getByRole('alert').filter({ hasText: '检查需要修正' })).toHaveCount(0);
    await expect(timeline.getByRole('heading', { name: '理卷 · 整理交付资料', exact: true })).toHaveCount(3);
    await expect(timeline.getByRole('heading', { name: '淬炼 · 逐项校准状态', exact: true })).toHaveCount(3);
    await expect(timeline.getByRole('heading', { name: '落印 · 记录交付结果', exact: true })).toHaveCount(1);
    await expect(timeline.getByRole('listitem')).toHaveCount(8);
    await page.clock.runFor(7_000);
    await expect(progress).toHaveAttribute('aria-valuenow', '100');
    await expect(timeline.getByRole('listitem')).toHaveCount(8);
  });

  test('keeps the dark mobile editor in reach, restores its menu trigger on cancel and clears the history into an empty state', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openForge(page, 'dark');
    await expectNoPageOverflow(page);
    const trigger = page.getByRole('button', { name: '工坊操作', exact: true });
    await trigger.focus(); await trigger.press('ArrowDown');
    const menu = page.getByRole('menu', { name: '工坊操作', exact: true });
    await expect(menu).toBeVisible();
    await expectInsideViewport(menu);
    await expectNoPageOverflow(page);
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: '交付资料', exact: true });
    await expect(drawer).toBeVisible();
    await expectInsideViewport(drawer);
    await drawer.getByRole('textbox', { name: '组件包名称', exact: true }).fill('mobile-forge-draft');
    await drawer.getByRole('textbox', { name: '交付说明', exact: true }).fill('这份草稿将取消，不写回当前交付档案。');
    const cancel = drawer.getByRole('button', { name: '取消编辑', exact: true });
    await expect(cancel).toBeInViewport();
    await expectNoPageOverflow(page);
    await cancel.click();
    await expect(drawer).toBeHidden(); await expect(trigger).toBeFocused();
    await expect(page.getByRole('region', { name: '交付档案', exact: true })).toContainText('malang-ui');
    await expect(page.getByRole('region', { name: '交付档案', exact: true })).not.toContainText('mobile-forge-draft');
    await trigger.press('ArrowDown'); await page.keyboard.press('End');
    const clear = menu.getByRole('menuitem', { name: '清空运行记录', exact: true });
    await expect(clear).toBeFocused(); await page.keyboard.press('Enter');
    const history = page.getByRole('region', { name: '工坊运行记录', exact: true });
    await expect(history.getByRole('heading', { name: '暂无记录', exact: true })).toBeVisible();
    await expect(history.getByRole('listitem')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('group', { name: '记录已清空', exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '记录已清空' })).toHaveCount(1);
    await trigger.press('ArrowDown'); await expect(clear).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await expectNoPageOverflow(page);
  });
});
