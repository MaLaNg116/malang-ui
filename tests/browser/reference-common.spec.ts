import { expect, test as base, type Page } from '@playwright/test';
import jsQR from 'jsqr';
const test = base.extend<{ browserErrors: string[] }>({ browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); await use(errors); expect(errors).toEqual([]); }, { auto: true }] });
async function story(page: Page, title: string, name = 'default', globals = 'theme:light;palette:paper;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string }[];
  const entry = entries.find(e => e.title === title && e.type === 'story' && e.id.endsWith(`--${name}`)); expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
test('QR code renders independently decodable SVG and canvas and exposes actual downloads', async ({ page }) => {
  await story(page, '数据展示/QRCode 二维码', 'canvas');
  const code = page.locator('.ui-qrcode canvas');
  await expect.poll(() => code.evaluate((node: HTMLCanvasElement) => node.width)).toBeGreaterThan(100);
  const raster = await code.evaluate((node: HTMLCanvasElement) => ({ width: node.width, height: node.height, pixels: Array.from(node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data) }));
  expect(jsQR(new Uint8ClampedArray(raster.pixels), raster.width, raster.height)?.data).toBe('墨浪 / 功夫朋克 🖋️');
  await story(page, '数据展示/QRCode 二维码', 'editor');
  await page.getByRole('textbox', { name: '二维码内容', exact: true }).fill('墨浪 / 更新后的二维码');
  const svg = await page.locator('.ui-qrcode svg').evaluate(async node => {
    const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(node))}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 400; const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0, 400, 400);
    return Array.from(context.getImageData(0, 0, 400, 400).data);
  });
  expect(jsQR(new Uint8ClampedArray(svg), 400, 400)?.data).toBe('墨浪 / 更新后的二维码');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: '下载PNG', exact: true }).click(); expect((await download).suggestedFilename()).toBe('墨浪二维码.png');
  await story(page, '数据展示/QRCode 二维码', 'states'); await page.getByRole('button', { name: '刷新', exact: true }).click(); await expect(page.locator('.ui-qrcode[data-status="expired"]')).toHaveCount(0);
  await story(page, '数据展示/QRCode 二维码', 'invalid'); await expect(page.locator('.ui-qrcode[data-status="error"]')).toBeVisible(); await expect(page.getByRole('status')).toContainText('不能为空');
});
test('typography preserves controlled edits, cancel, IME and real expansion', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await story(page, '基础组件/Typography 文字', 'editing');
  await page.getByRole('button', { name: '编辑', exact: true }).click(); const editor = page.getByRole('textbox', { name: '编辑文字', exact: true });
  await editor.fill('新档案'); await editor.dispatchEvent('keydown', { key: 'Enter', isComposing: true }); await expect(editor).toBeVisible();
  await editor.press('Enter'); await expect(editor).toHaveCount(0); await expect(page.locator('.ui-typography__text').filter({ hasText: '新档案' })).toBeVisible();
  await page.getByRole('button', { name: '编辑', exact: true }).click(); await editor.fill('不保存'); await editor.press('Escape'); await expect(page.locator('.ui-typography__text').filter({ hasText: '新档案' })).toBeVisible();
  await page.getByRole('button', { name: '复制', exact: true }).click(); await expect(page.getByRole('button', { name: '已复制', exact: true })).toBeVisible(); expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('新档案');
  const ellipsis = page.locator('.ui-typography__text--ellipsis'); const before = await ellipsis.evaluate(el => el.clientHeight); await page.getByRole('button', { name: '展开', exact: true }).click();
  expect(await page.locator('.ui-typography__text').filter({ hasText: '水墨藏锋' }).evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(before);
  await expect(page.getByText('暂不可用', { exact: true })).not.toHaveAttribute('href');
});
test('App provides top messages, notification cards and validated prompt results', async ({ page }) => {
  await story(page, '配置/App 应用上下文');
  await page.getByRole('button', { name: '轻提示', exact: true }).click(); const message = page.locator('.ui-toast--message'); await expect(message).toContainText('已保存'); expect((await message.boundingBox())!.y).toBe(8);
  await page.getByRole('button', { name: '通知', exact: true }).click(); await expect(page.locator('.ui-toast--notification')).toContainText('档案更新');
  await page.getByRole('button', { name: '打开输入确认', exact: true }).click(); const dialog = page.getByRole('dialog', { name: '重命名档案', exact: true }); await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '确认', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('请至少输入两个字');
  await dialog.getByRole('textbox', { name: '档案名称', exact: true }).fill('藏品一号'); await dialog.getByRole('button', { name: '确认', exact: true }).click(); await expect(dialog).toHaveCount(0); await expect(page.locator('output')).toHaveText('confirm:藏品一号');
  await page.getByRole('button', { name: '开始等待', exact: true }).click(); await expect(page.locator('.ui-toast--loading')).toContainText('正在校对'); await page.getByRole('button', { name: '完成等待', exact: true }).click(); await expect(page.locator('.ui-toast--success')).toContainText('校对完成');
  await page.getByRole('button', { name: '关闭全部', exact: true }).click(); await expect(page.locator('.ui-toast')).toHaveCount(0);
});
test('nested providers keep locale and App service disposal scoped', async ({ page }) => {
  await story(page, '配置/App 应用上下文', 'scoped'); const english = page.getByTestId('english'), chinese = page.getByTestId('chinese');
  await english.getByRole('button', { name: '打开输入确认' }).click(); const dialog = page.getByRole('dialog'); await expect(dialog.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible(); await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await chinese.getByRole('button', { name: '开始等待' }).click(); await english.getByRole('button', { name: '关闭全部' }).click(); await expect(chinese.locator('.ui-toast--loading')).toBeVisible(); await chinese.getByRole('button', { name: '关闭全部' }).click();
});
test('loading masks block keyboard interaction and clean up component, directive and service state', async ({ page }) => {
  await story(page, '配置/App 应用上下文', 'loading');
  await page.getByRole('button', { name: '切换局部加载', exact: true }).click(); await expect(page.locator('.ui-loading__content[inert]')).toHaveCount(1); await page.getByRole('button', { name: '取消', exact: true }).click(); await expect(page.locator('.ui-loading__content[inert]')).toHaveCount(0);
  await page.getByRole('button', { name: '切换指令加载', exact: true }).click(); expect(await page.getByRole('button', { name: '指令区域按钮', includeHidden: true }).evaluate(el => !!el.closest('[inert]'))).toBe(true);
  await page.getByRole('button', { name: '切换指令加载', exact: true }).click(); await expect(page.getByRole('button', { name: '指令区域按钮', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '服务加载', exact: true }).click(); await expect(page.getByRole('status')).toContainText('服务加载中'); await page.getByRole('button', { name: '关闭服务', exact: true }).click(); await expect(page.locator('.ui-loading-service')).toHaveCount(0);
  await page.getByRole('button', { name: '全屏加载', exact: true }).click(); const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible(); await dialog.getByRole('button', { name: '取消', exact: true }).click(); await expect(dialog).not.toBeVisible();
});
test('long Message uses the same readable narrow scrollbar in all four themes', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  for (const globals of ['theme:light;palette:paper', 'theme:light;palette:celadon', 'theme:light;palette:gilt', 'theme:dark;palette:paper']) {
    await story(page, '反馈组件/Message 全局提示', 'long-content', globals); await page.getByRole('button', { name: '显示长文提示', exact: true }).click();
    const thumb = page.locator('.ui-toast [role="scrollbar"]'), content = page.locator('.ui-toast__content'); await expect(thumb).toBeVisible();
    await thumb.focus(); await thumb.press('End'); expect(await content.evaluate(el => el.scrollTop)).toBeGreaterThan(0); await thumb.press('Home'); await expect.poll(() => content.evaluate(el => el.scrollTop)).toBe(0);
    const box = await page.locator('.ui-toast').boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    expect(await content.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  }
});
