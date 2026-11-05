import { expect, test, type Page } from '@playwright/test';
import jsQR from 'jsqr';

async function openStory(page: Page, name: string) {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, { id: string; title: string; type: string }> };
  const entry = Object.values(index.entries).find(item => item.title === '配置/反馈生命周期' && item.type === 'story' && item.id.endsWith(`--${name}`));
  expect(entry).toBeDefined();
  const params = new URLSearchParams({ id: entry!.id, viewMode: 'story', globals: 'theme:light;motion:reduced' });
  await page.goto(`/iframe.html?${params}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

test('keyed feedback shares live updates and isolates handles after close and destroyAll', async ({ page }) => {
  await openStory(page, 'keyed-feedback');
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const toast = page.locator('.ui-toast--message');

  await button('开始校对').click();
  await expect(toast).toContainText('正在校对档案');
  const initial = await toast.elementHandle();

  await button('继续同键任务').click();
  await expect(toast).toHaveCount(1);
  await expect(toast).toContainText('同键校对已继续');
  expect(await initial!.evaluate(node => node.isConnected)).toBe(true);
  await button('从原句柄更新').click();
  await expect(toast).toContainText('原句柄更新了提示');

  async function expectPreviousHandleIsolated(content: string) {
    await button('从原句柄更新').click();
    await expect(toast).toContainText(content);
    await button('从原句柄关闭').click();
    await expect(toast).toHaveCount(1);
    await expect(toast).toContainText(content);
  }

  await button('关闭后重开').click();
  await expect(toast).toContainText('关闭后的新任务');
  expect(await initial!.evaluate(node => node.isConnected)).toBe(false);
  await expectPreviousHandleIsolated('关闭后的新任务');

  const replacement = await toast.elementHandle();
  await button('清空后重开').click();
  await expect(toast).toContainText('清空后的新任务');
  expect(await replacement!.evaluate(node => node.isConnected)).toBe(false);
  await expectPreviousHandleIsolated('清空后的新任务');
  await button('完成当前任务').click();
  await expect(toast).toContainText('当前任务已完成');
});

test('a zero-size QR icon skips its URL and preserves the canvas and PNG export', async ({ page }) => {
  const iconRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/missing-feedback-lifecycle-icon.png') iconRequests.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));

  await openStory(page, 'suppressed-icon');
  const canvas = page.getByRole('img', { name: '档案交接二维码', exact: true });
  await expect(canvas).toBeVisible();
  await expect.poll(() => canvas.evaluate((node: HTMLCanvasElement) => node.getContext('2d')?.getImageData(0, 0, 1, 1).data[3])).toBe(255);
  const raster = await canvas.evaluate((node: HTMLCanvasElement) => ({
    width: node.width,
    height: node.height,
    pixels: Array.from(node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data),
  }));
  expect(jsQR(new Uint8ClampedArray(raster.pixels), raster.width, raster.height)?.data).toBe('墨浪 / 档案交接');

  await page.getByRole('button', { name: '生成 PNG', exact: true }).click();
  const png = page.getByRole('img', { name: 'PNG 导出预览', exact: true });
  await expect(png).toHaveAttribute('src', /^data:image\/png;base64,/);
  const exported = await png.evaluate(async (node: HTMLImageElement) => {
    await node.decode();
    const canvas = document.createElement('canvas');
    canvas.width = node.naturalWidth;
    canvas.height = node.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(node, 0, 0);
    return { width: canvas.width, height: canvas.height, pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data) };
  });
  expect(jsQR(new Uint8ClampedArray(exported.pixels), exported.width, exported.height)?.data).toBe('墨浪 / 档案交接');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(iconRequests).toEqual([]);
  expect(errors).toEqual([]);
});
