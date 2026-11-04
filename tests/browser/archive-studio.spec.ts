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
async function openStudio(page: Page, theme = 'light') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string }[];
  const story = entries.find(entry => entry.type === 'story' && entry.title === '开始/藏品归档台' && entry.id.endsWith('--default'));
  expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=theme:${theme};motion:reduced`);
  await expect(page.getByRole('heading', { name: '藏锋于卷，万象有序。', exact: true })).toBeVisible();
}
function previewValue(page: Page, label: string) {
  return page.getByRole('region', { name: '本次登记预览', exact: true }).getByRole('term').filter({ hasText: label }).locator('..').getByRole('definition');
}
const attachment = { name: '折锋纹理.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M1 10L6 2L10 10"/></svg>') };

test.describe('Local archive studio', () => {
  test('separates tree focus from selection, preserves a draft across navigation, and registers actual local attachments', async ({ page }) => {
    await openStudio(page);
    const title = page.getByRole('textbox', { name: '条目名称', exact: true });
    const date = page.getByRole('textbox', { name: '归档日期', exact: true });
    await title.fill('藏锋 · 本地试作');
    await date.fill('2026-11-05'); await date.press('Tab');
    await page.getByLabel('本地附件', { exact: true }).setInputFiles(attachment);
    await expect(page.getByText('折锋纹理.svg', { exact: true })).toBeVisible();
    await expect(previewValue(page, '已选附件')).toHaveText('1 个');
    const tree = page.getByRole('tree', { name: '素材卷宗目录', exact: true });
    const brush = tree.getByRole('treeitem', { name: '原创墨迹', exact: true });
    const seal = tree.getByRole('treeitem', { name: '朱砂印记', exact: true });
    const mechanism = tree.getByRole('treeitem', { name: '机关构形', exact: true });
    await brush.focus(); await page.keyboard.press('ArrowDown');
    await expect(seal).toBeFocused(); await expect(seal).toHaveAttribute('aria-selected', 'false');
    await expect(previewValue(page, '目标目录')).toHaveText('原创墨迹');
    await page.keyboard.press('Enter');
    await expect(previewValue(page, '目标目录')).toHaveText('朱砂印记');
    await expect(page.getByRole('heading', { name: '这一卷尚待落笔', exact: true })).toBeVisible();
    await page.keyboard.press('ArrowDown'); await expect(mechanism).toBeFocused();
    await expect(previewValue(page, '目标目录')).toHaveText('朱砂印记');
    await page.keyboard.press('Enter'); await expect(previewValue(page, '目标目录')).toHaveText('机关构形');
    const navigation = page.getByRole('navigation', { name: '归档导航', exact: true });
    await navigation.getByRole('button', { name: '登记记录', exact: true }).click();
    await expect(page.getByRole('heading', { name: '登记记录', exact: true })).toBeVisible();
    await expect(title).toBeHidden();
    await navigation.getByRole('button', { name: '素材登记', exact: true }).click();
    await expect(title).toHaveValue('藏锋 · 本地试作'); await expect(date).toHaveValue('2026-11-05');
    await expect(page.getByText('折锋纹理.svg', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '登记素材', exact: false }).click();
    const row = page.getByRole('row').filter({ hasText: '藏锋 · 本地试作' });
    await expect(row).toHaveCount(1); await expect(row).toContainText('2026-11-05'); await expect(row).toContainText('1 个');
    await expect(page.getByRole('group', { name: '本地登记完成', exact: true })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '藏锋 · 本地试作' })).toHaveCount(1);
    await navigation.getByRole('button', { name: '登记记录', exact: true }).click();
    await expect(page.getByRole('region', { name: '本次归档操作记录', exact: true })).toContainText('已登记「藏锋 · 本地试作」至机关构形');
  });

  test('keeps invalid date and missing attachments from producing records, then clears a local draft at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openStudio(page, 'dark');
    const title = page.getByRole('textbox', { name: '条目名称', exact: true });
    const date = page.getByRole('textbox', { name: '归档日期', exact: true });
    await page.getByRole('button', { name: /登记素材/ }).click();
    await expect(title).toBeFocused(); await expect(page.getByText('请填写条目名称。', { exact: true })).toBeVisible();
    await title.fill('边界 · 日期校验');
    await page.getByLabel('本地附件', { exact: true }).setInputFiles(attachment);
    await date.fill('2026-02-30'); await date.press('Tab');
    await page.getByRole('button', { name: /登记素材/ }).click();
    await expect(date).toHaveValue('2026-02-30');
    await expect(date).toBeFocused();
    expect(await date.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
    await expect(page.getByRole('row').filter({ hasText: '边界 · 日期校验' })).toHaveCount(0);
    await page.getByRole('button', { name: '清空草稿', exact: true }).click();
    await expect(title).toHaveValue(''); await expect(date).toHaveValue('2026-11-04');
    expect(await date.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true);
    await expect(previewValue(page, '已选附件')).toHaveText('0 个');
    const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(geometry.scroll).toBe(geometry.viewport);
    await expect(page.getByRole('group', { name: '本地登记完成', exact: true })).toHaveCount(0);
    await title.fill('键盘提交 · 日期草稿');
    await page.getByLabel('本地附件', { exact: true }).setInputFiles(attachment);
    await date.fill('2026-11-07');
    await expect(date).toBeFocused();
    await date.evaluate((element: HTMLInputElement) => element.form?.requestSubmit());
    const submitted = page.getByRole('row').filter({ hasText: '键盘提交 · 日期草稿' });
    await expect(submitted).toHaveCount(1); await expect(submitted).toContainText('2026-11-07');
    await expect(previewValue(page, '归档日期')).toHaveText('2026-11-07');
  });

  test('returns from a detail drawer to its own row, then removes that row and exposes a real operation record', async ({ page }) => {
    await openStudio(page, 'dark');
    const view = page.getByRole('button', { name: '查看枯锋 · 起笔研究', exact: true });
    await view.click();
    const drawer = page.getByRole('dialog', { name: '卷宗详情', exact: true });
    await expect(drawer).toBeVisible(); await expect(drawer).toContainText('起笔纹理.png');
    await drawer.getByRole('button', { name: '返回清单', exact: true }).click();
    await expect(drawer).toBeHidden(); await expect(view).toBeFocused();
    await page.getByRole('button', { name: '移除枯锋 · 起笔研究', exact: true }).click();
    await expect(view).toHaveCount(0);
    await expect(page.getByRole('button', { name: '查看回锋 · 干墨叠层', exact: true })).toBeFocused();
    await expect(page.getByRole('group', { name: '条目已移除', exact: true })).toBeVisible();
    await page.getByRole('navigation', { name: '归档导航', exact: true }).getByRole('button', { name: '登记记录', exact: true }).click();
    await expect(page.getByRole('region', { name: '本次归档操作记录', exact: true })).toContainText('已从当前演示移除「枯锋 · 起笔研究」。');
  });
});
