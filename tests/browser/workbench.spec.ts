import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text());
    });
    await use(errors);
    expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});

type StoryEntry = { id: string; title: string; type: string; exportName?: string };

async function openWorkbench(page: Page, theme = 'light') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '开始/业务组合工作台'
    && (entry.exportName === 'Default' || entry.id.endsWith('--default')));
  expect(story, 'The business workbench story exists').toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=theme:${theme};motion:reduced`);
  await expect(page.getByRole('heading', { name: '落笔成档，井然有序。', level: 1, exact: true })).toBeVisible();
}

async function expectNoPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}

test.describe('Business workbench', () => {
  test('filters and pages records, restores edit focus and falls back to the list when a record leaves its filter', async ({ page }) => {
    await openWorkbench(page);
    const table = page.getByRole('table', { name: '项目列表', exact: true });
    const pagination = page.getByRole('navigation', { name: '分页导航', exact: true });
    await page.getByRole('combobox', { name: '项目阶段', exact: true }).selectOption({ label: '进行中' });
    await expect(pagination.getByRole('status')).toHaveText('共 8 条 · 第 1 / 2 页');
    await pagination.getByRole('button', { name: '第 2 页', exact: true }).click();
    await expect(pagination.getByRole('status')).toHaveText('共 8 条 · 第 2 / 2 页');
    await expect(table.getByRole('row')).toHaveCount(3);

    await table.getByRole('button', { name: '编辑笔触材质实验 · 3', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '编辑项目', exact: true });
    await expect(dialog.getByRole('textbox', { name: '项目名称', exact: true })).toHaveValue('笔触材质实验 · 3');
    await dialog.getByRole('textbox', { name: '项目名称', exact: true }).fill('笔触工作台 · 已更新');
    await dialog.getByRole('combobox', { name: '归属团队', exact: true }).selectOption({ label: '研发组' });
    await dialog.getByRole('textbox', { name: '项目说明', exact: true }).fill('保存后继续筛选这份已经更新的项目。');
    await dialog.getByRole('checkbox', { name: '标为重点项目', exact: true }).check();
    await dialog.getByRole('button', { name: '保存项目', exact: true }).click();
    await expect(dialog).toBeHidden();

    const changedRow = table.getByRole('row').filter({ hasText: '笔触工作台 · 已更新' });
    await expect(changedRow).toContainText('研发组');
    await expect(changedRow).toContainText('进行中');
    await expect(changedRow).toContainText('重点');
    await expect(changedRow.getByRole('button', { name: '编辑笔触工作台 · 已更新', exact: true })).toBeFocused();
    const notification = page.getByRole('group', { name: '项目已保存', exact: true });
    await expect(notification).toContainText('「笔触工作台 · 已更新」已保存到当前预览。');
    const announcements = page.getByRole('status').filter({ hasText: '笔触工作台 · 已更新' });
    await expect(announcements).toHaveCount(1);
    await expect(announcements).toHaveText('项目已保存 「笔触工作台 · 已更新」已保存到当前预览。');

    await page.getByRole('searchbox', { name: '搜索项目', exact: true }).fill('笔触工作台');
    await expect(pagination.getByRole('status')).toHaveText('共 1 条 · 第 1 / 1 页');
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(changedRow).toBeVisible();
    await expect(pagination.getByRole('button', { name: /上一页/ })).toBeDisabled();
    await expect(pagination.getByRole('button', { name: /下一页/ })).toBeDisabled();

    await changedRow.getByRole('button', { name: '编辑笔触工作台 · 已更新', exact: true }).click();
    await dialog.getByRole('radiogroup', { name: '项目阶段', exact: true }).getByRole('radio', { name: '已完成', exact: true }).check();
    await dialog.getByRole('button', { name: '保存项目', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(changedRow).toHaveCount(0);
    await expect(table.getByText('没有匹配的项目', { exact: true })).toBeVisible();
    await expect(pagination.getByRole('status')).toHaveText('暂无记录');
    await expect(notification).toBeVisible();
    const list = page.getByRole('region', { name: '项目档案', exact: true });
    await expect(list.getByRole('heading', { name: '项目档案', level: 2, exact: true })).toBeFocused();
  });

  test('validates a new record, inserts it and recovers the full list after an empty search', async ({ page }) => {
    await openWorkbench(page, 'dark');
    const create = page.getByRole('button', { name: '新建项目', exact: true });
    await create.click();
    const dialog = page.getByRole('dialog', { name: '新建项目', exact: true });
    const name = dialog.getByRole('textbox', { name: '项目名称', exact: true });
    await dialog.getByRole('button', { name: '保存项目', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveText('请填写项目名称。');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toBeFocused();
    await name.fill('新建交互档案');
    await dialog.getByRole('combobox', { name: '归属团队', exact: true }).selectOption({ label: '交互组' });
    await dialog.getByRole('radiogroup', { name: '项目阶段', exact: true }).getByRole('radio', { name: '进行中', exact: true }).check();
    await dialog.getByRole('textbox', { name: '项目说明', exact: true }).fill('用真实表单操作创建的一份档案。');
    await dialog.getByRole('checkbox', { name: '标为重点项目', exact: true }).check();
    await dialog.getByRole('button', { name: '保存项目', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(create).toBeFocused();

    const table = page.getByRole('table', { name: '项目列表', exact: true });
    const createdRow = table.getByRole('row').filter({ hasText: '新建交互档案' });
    await expect(createdRow).toContainText('交互组');
    await expect(createdRow).toContainText('进行中');
    await expect(createdRow).toContainText('重点');
    const pagination = page.getByRole('navigation', { name: '分页导航', exact: true });
    await expect(pagination.getByRole('status')).toHaveText('共 25 条 · 第 1 / 5 页');
    await expect(page.getByRole('group', { name: '项目已保存', exact: true })).toContainText('「新建交互档案」已保存到当前预览。');

    const search = page.getByRole('searchbox', { name: '搜索项目', exact: true });
    await search.fill('不会存在的项目-404');
    await expect(table.getByText('没有匹配的项目', { exact: true })).toBeVisible();
    await expect(pagination.getByRole('status')).toHaveText('暂无记录');
    await table.getByRole('button', { name: '恢复完整列表', exact: true }).click();
    await expect(search).toHaveValue('');
    await expect(page.getByRole('combobox', { name: '项目阶段', exact: true })).toHaveValue('');
    await expect(pagination.getByRole('status')).toHaveText('共 25 条 · 第 1 / 5 页');
    await expect(createdRow).toBeVisible();
  });

  test('uses display preferences and refreshes a filtered list without widening a 360px page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
    await openWorkbench(page, 'dark');
    await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z'));
    const table = page.getByRole('table', { name: '项目列表', exact: true });
    const tableRegion = page.getByRole('region', { name: '项目列表', exact: true });
    expect(await tableRegion.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await expectNoPageOverflow(page);

    const settings = page.getByRole('button', { name: '显示设置', exact: true });
    await settings.focus();
    await settings.press('Enter');
    const popover = page.getByRole('dialog', { name: '显示设置', exact: true });
    await expect(popover).toBeVisible();
    const density = popover.getByRole('radiogroup', { name: '界面密度', exact: true });
    await density.getByRole('radio', { name: '紧凑', exact: true }).check();
    await expect(density.getByRole('radio', { name: '紧凑', exact: true })).toBeChecked();
    await popover.getByRole('checkbox', { name: '仅显示重点项目', exact: true }).check();
    const pagination = page.getByRole('navigation', { name: '分页导航', exact: true });
    await expect(pagination.getByRole('status')).toHaveText('共 6 条 · 第 1 / 1 页');
    await popover.getByRole('button', { name: '关闭气泡', exact: true }).click();
    await expect(popover).toBeHidden();
    await expect(settings).toBeFocused();
    for (const row of (await table.getByRole('row').all()).slice(1)) await expect(row).toContainText('重点');

    await page.getByRole('button', { name: '刷新列表', exact: true }).click();
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(table.getByRole('status')).toHaveText('正在读取项目');
    await expect(page.getByRole('button', { name: '读取中', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: '新建项目', exact: true })).toBeDisabled();
    await expect(page.getByRole('searchbox', { name: '搜索项目', exact: true })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: '项目阶段', exact: true })).toBeDisabled();
    for (const button of await pagination.getByRole('button').all()) await expect(button).toBeDisabled();
    await expectNoPageOverflow(page);
    await page.clock.runFor(650);
    await expect(table).not.toHaveAttribute('aria-busy');
    await expect(table.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '刷新列表', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: '新建项目', exact: true })).toBeEnabled();
    await expect(page.getByRole('searchbox', { name: '搜索项目', exact: true })).toBeEnabled();
    await expect(pagination.getByRole('status')).toHaveText('共 6 条 · 第 1 / 1 页');
    await expect(table.getByRole('row')).toHaveCount(7);
    expect(await tableRegion.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await expectNoPageOverflow(page);
  });
});
