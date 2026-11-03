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

async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:standard') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === title
    && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

async function expectNoPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}

test.describe('Pagination and breadcrumb', () => {
  test('navigates bounded pages with buttons and the keyboard, and disables empty records', async ({ page }) => {
    await openStory(page, '基础组件/Pagination 分页');
    const pagination = page.getByRole('navigation', { name: '分页导航', exact: true });
    await expect(pagination.getByRole('status')).toHaveText('共 86 条 · 第 1 / 9 页');
    await expect(pagination.getByRole('button', { name: /上一页/ })).toBeDisabled();
    await pagination.getByRole('button', { name: /下一页/ }).click();
    await expect(pagination.getByRole('button', { name: '第 2 页', exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('父模型页码：2', { exact: true })).toBeVisible();
    await pagination.getByRole('button', { name: '第 9 页', exact: true }).click();
    await expect(pagination.getByRole('status')).toHaveText('共 86 条 · 第 9 / 9 页');
    await expect(pagination.getByRole('button', { name: /下一页/ })).toBeDisabled();
    await pagination.getByRole('button', { name: /上一页/ }).click();
    await expect(page.getByText('父模型页码：8', { exact: true })).toBeVisible();
    const first = pagination.getByRole('button', { name: '第 1 页', exact: true });
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('aria-current', 'page');
    await expect(page.getByText('父模型页码：1', { exact: true })).toBeVisible();

    await openStory(page, '基础组件/Pagination 分页', 'Empty');
    await expect(pagination.getByRole('status')).toHaveText('暂无记录');
    for (const button of await pagination.getByRole('button').all()) await expect(button).toBeDisabled();
  });

  test('clamps displayed pages after total changes without silently rewriting the parent model', async ({ page }) => {
    await openStory(page, '基础组件/Pagination 分页', 'ChangingTotal');
    const pagination = page.getByRole('navigation', { name: '分页导航', exact: true });
    await expect(pagination.getByRole('status')).toHaveText('共 86 条 · 第 8 / 9 页');
    await page.getByRole('button', { name: '切换记录总量', exact: true }).click();
    await expect(pagination.getByRole('status')).toHaveText('共 12 条 · 第 2 / 2 页');
    await expect(page.getByText('父模型页码：8 · 记录数：12', { exact: true })).toBeVisible();
    await pagination.getByRole('button', { name: '第 2 页', exact: true }).click();
    await expect(page.getByText('父模型页码：2 · 记录数：12', { exact: true })).toBeVisible();

    await openStory(page, '基础组件/Pagination 分页', 'Disabled');
    for (const button of await pagination.getByRole('button').all()) await expect(button).toBeDisabled();
    await page.setViewportSize({ width: 360, height: 800 });
    await openStory(page, '基础组件/Pagination 分页', 'Middle', 'theme:dark;density:compact;motion:reduced');
    await expect(pagination.getByRole('button', { name: '第 5 页', exact: true })).toHaveAttribute('aria-current', 'page');
    await expectNoPageOverflow(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await openStory(page, '基础组件/Pagination 分页', 'LargeTotal');
    await expect(pagination.getByRole('status')).toHaveText('共 9007199254740991 条 · 第 9007199254740991 / 9007199254740991 页');
    await expect(pagination.getByRole('button')).toHaveCount(5);
    await expect(pagination.getByRole('button', { name: /下一页/ })).toBeDisabled();
  });

  test('uses real ancestor links and a non-link current breadcrumb that wraps on mobile', async ({ page }) => {
    await openStory(page, '基础组件/Breadcrumb 面包屑');
    const breadcrumb = page.getByRole('navigation', { name: '面包屑导航', exact: true });
    await expect(breadcrumb.getByRole('link')).toHaveCount(2);
    const first = breadcrumb.getByRole('link', { name: '组件库', exact: true });
    await expect(first).toHaveAttribute('href', '#library');
    await expect(breadcrumb.getByRole('link', { name: '工作空间', exact: true })).toHaveAttribute('href', '#workspace');
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('项目档案');
    await expect(breadcrumb.getByRole('link', { name: '项目档案', exact: true })).toHaveCount(0);
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#library$/);
    await page.setViewportSize({ width: 360, height: 800 });
    await openStory(page, '基础组件/Breadcrumb 面包屑', 'LongPath', 'theme:dark');
    await expect(breadcrumb.locator('[aria-current="page"]')).toContainText('ProjectArchiveWithUnbrokenCharacters');
    await expectNoPageOverflow(page);
  });
});

test.describe('Table', () => {
  test('keeps native caption and column headers while cell buttons remain independently operable', async ({ page }) => {
    await openStory(page, '基础组件/Table 表格');
    const table = page.getByRole('table', { name: '项目档案', exact: true });
    await expect(table.locator('caption')).toHaveText('项目档案');
    await expect(table.getByRole('columnheader')).toHaveCount(4);
    for (const header of await table.getByRole('columnheader').all()) await expect(header).toHaveAttribute('scope', 'col');
    await expect(table.getByRole('row')).toHaveCount(4);
    const row = table.getByRole('row').filter({ hasText: '观山设计档案' });
    expect(await row.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    await expect(row).not.toHaveAttribute('role', 'button');
    const action = row.getByRole('button', { name: '查看观山设计档案', exact: true });
    await action.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('已查看：观山设计档案');
    await expect(action).toBeFocused();
  });

  test('presents explicit empty, loading and missing-column states without losing table semantics', async ({ page }) => {
    await openStory(page, '基础组件/Table 表格', 'Empty');
    const table = page.getByRole('table', { name: '项目档案', exact: true });
    await expect(table.getByRole('heading', { name: '暂无数据', level: 3, exact: true })).toBeVisible();
    await expect(table.getByRole('columnheader')).toHaveCount(4);
    await expect(table.getByRole('button')).toHaveCount(0);
    await openStory(page, '基础组件/Table 表格', 'Loading');
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(table.getByRole('status')).toHaveText('正在加载数据');
    await expect(table.getByRole('columnheader')).toHaveCount(4);
    await openStory(page, '基础组件/Table 表格', 'NoColumns');
    await expect(table.getByRole('columnheader')).toHaveCount(0);
    await expect(table.getByRole('heading', { name: '暂无列配置', level: 3, exact: true })).toBeVisible();
    await expect(table.getByRole('row')).toHaveCount(1);
  });

  test('keeps horizontal scrolling inside the table and exposes the scroll region to keyboard users', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const theme of ['light', 'dark']) {
      await openStory(page, '基础组件/Table 表格', 'LongCells', `theme:${theme};motion:reduced`);
      const region = page.getByRole('region', { name: '项目档案', exact: true });
      await expect(region).toHaveAttribute('tabindex', '0');
      expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
      await expectNoPageOverflow(page);
      await region.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await expectNoPageOverflow(page);
    }
  });
});

test.describe('Feedback foundations', () => {
  test('exposes one loading message, hides decorative skeletons and respects both reduced-motion sources', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const globals of ['theme:dark;motion:standard', 'theme:light;motion:reduced']) {
      if (globals.includes('motion:reduced')) await page.emulateMedia({ reducedMotion: 'no-preference' });
      await openStory(page, '基础组件/Spinner 加载标记', 'Default', globals);
      const spinner = page.getByRole('status');
      await expect(spinner).toHaveText('加载中');
      await expect(page.getByText('加载中', { exact: true })).toHaveCount(1);
      await expect(spinner.locator('svg')).toHaveAttribute('aria-hidden', 'true');
      const spinnerMotion = await spinner.locator('svg').evaluate(element => ({ name: getComputedStyle(element).animationName, duration: getComputedStyle(element).animationDuration }));
      expect(spinnerMotion.name === 'none' || spinnerMotion.duration.split(',').every(value => parseFloat(value) === 0)).toBe(true);
      await openStory(page, '基础组件/Skeleton 骨架屏', 'Default', globals);
      const skeleton = page.locator('.ui-skeleton');
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      await expect(page.getByRole('status')).toHaveCount(0);
      const skeletonMotion = await skeleton.locator('span').evaluateAll(elements => elements.map(element => ({ name: getComputedStyle(element).animationName, duration: getComputedStyle(element).animationDuration })));
      expect(skeletonMotion.every(value => value.name === 'none' || value.duration.split(',').every(duration => parseFloat(duration) === 0))).toBe(true);
    }
  });

  test('keeps static alerts quiet, announces an explicit dynamic error and preserves empty-state actions', async ({ page }) => {
    await openStory(page, '基础组件/Alert 提示块');
    const note = page.getByRole('note', { name: '新的说明已就绪', exact: true });
    await expect(note).toBeVisible();
    await expect(note).not.toHaveAttribute('aria-live');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveCount(0);
    await openStory(page, '基础组件/Alert 提示块', 'DynamicAnnouncement');
    const trigger = page.getByRole('button', { name: '显示动态错误提示', exact: true });
    await trigger.click();
    const alert = page.getByRole('alert', { name: '档案名称未填写', exact: true });
    await expect(alert).toContainText('请返回名称字段，补全后再保存。');
    await expect(alert).toHaveAttribute('aria-atomic', 'true');
    await expect(page.getByRole('button', { name: '收起动态错误提示', exact: true })).toBeFocused();
    await openStory(page, '基础组件/Empty 空状态', 'WithAction');
    const clear = page.getByRole('button', { name: '清除筛选', exact: true });
    await clear.click();
    await expect(page.getByRole('heading', { name: '尚未建立档案', level: 3, exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('已清除示例筛选。');
    await expect(clear).toBeDisabled();
  });
});
