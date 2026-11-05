import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
async function open(page: Page, story = 'default', globals = 'theme:dark;motion:reduced', title = '数据组件/Scrollbar 滚动条') {
  const index = await (await page.request.get('/index.json')).json();
  const entry = Object.values(index.entries).find((entry: any) => entry.title === title && entry.type === 'story' && entry.id.endsWith(`--${story}`)) as { id: string };
  expect(entry).toBeDefined(); await page.goto(`/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
test('custom scrollbar moves actual content with keyboard, track and pointer dragging on both axes', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); await open(page);
  const viewport = page.getByRole('region', { name: '卷宗滚动区', exact: true });
  const vertical = page.getByRole('scrollbar', { name: '卷宗滚动区 纵向滚动', exact: true }), horizontal = page.getByRole('scrollbar', { name: '卷宗滚动区 横向滚动', exact: true });
  await expect(vertical).toBeVisible(); await expect(horizontal).toBeVisible(); await vertical.focus(); await vertical.press('End');
  expect(await viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(3000); await expect(vertical).toBeFocused();
  await vertical.press('Home'); expect(await viewport.evaluate(element => element.scrollTop)).toBe(0);
  const thumb = await vertical.boundingBox(); expect(thumb).not.toBeNull(); await page.mouse.move(thumb!.x + thumb!.width / 2, thumb!.y + thumb!.height / 2); await page.mouse.down(); await page.mouse.move(thumb!.x + 2, thumb!.y + 100, { steps: 6 }); await page.mouse.up();
  expect(await viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(500);
  await horizontal.focus(); await horizontal.press('End'); expect(await viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(200);
  await horizontal.press('Home'); expect(await viewport.evaluate(element => element.scrollLeft)).toBe(0);
  await viewport.evaluate(element => { element.setAttribute('dir', 'rtl'); element.scrollLeft = 0; element.dispatchEvent(new Event('scroll')); });
  await horizontal.focus(); await horizontal.press('Home'); expect(await viewport.evaluate(element => element.scrollLeft)).toBeLessThan(-200);
  await horizontal.press('End'); expect(await viewport.evaluate(element => element.scrollLeft)).toBe(0);
  await page.getByRole('button', { name: '切换内容长度', exact: true }).click(); await expect(vertical).toHaveCount(0); await expect(horizontal).toBeVisible();
  await page.getByRole('button', { name: '切换滚动区域', exact: true }).click(); await expect(viewport).toHaveCount(0); await page.setViewportSize({ width: 360, height: 640 }); await page.getByRole('textbox', { name: '滚动区域外的草稿' }).fill('卸载后继续编辑'); expect(errors).toEqual([]);
});
test('max-height, narrow layouts and forced colors preserve usable native scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 600 }); await open(page, 'max-height', 'theme:light;palette:celadon;motion:reduced');
  const viewport = page.getByRole('region', { name: '自适应长文', exact: true });
  expect(await viewport.evaluate(element => element.clientHeight)).toBeLessThanOrEqual(220); await viewport.focus(); await viewport.press('End');
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  await page.emulateMedia({ forcedColors: 'active' }); await expect(page.getByRole('scrollbar')).toBeHidden();
  expect(await viewport.evaluate(element => getComputedStyle(element).scrollbarWidth)).toBe('auto');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
test('content grows without scrolling and RTL rails leave text unobstructed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page);
  const viewport = page.getByRole('region', { name: '卷宗滚动区', exact: true });
  const horizontal = page.getByRole('scrollbar', { name: '卷宗滚动区 横向滚动', exact: true });
  await expect(horizontal).toHaveAttribute('aria-valuemax', '294');
  const before = (await horizontal.boundingBox())!;
  await page.getByRole('button', { name: '加宽卷宗', exact: true }).click();
  expect(await viewport.evaluate(element => [element.clientWidth, element.scrollWidth, element.scrollLeft])).toEqual([706, 1400, 0]);
  await expect(horizontal).toHaveAttribute('aria-valuemax', '694');
  expect((await horizontal.boundingBox())!.width).toBeLessThan(before.width);

  await viewport.evaluate(element => element.setAttribute('dir', 'rtl'));
  const frame = page.locator('.ui-scrollbar');
  await expect(frame).toHaveAttribute('data-rtl', 'true');
  const xRail = (await frame.locator('.ui-scrollbar__rail--x').boundingBox())!;
  const yRail = (await frame.locator('.ui-scrollbar__rail--y').boundingBox())!;
  const box = (await frame.boundingBox())!;
  expect(yRail.x - box.x).toBeLessThanOrEqual(2);
  expect(xRail.x).toBeGreaterThanOrEqual(yRail.x + yRail.width);
  const thumb = (await horizontal.boundingBox())!;
  await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
  await page.mouse.down();
  await expect(frame).toHaveAttribute('data-dragging', 'x');
  await page.getByRole('button', { name: '内容适配宽度', exact: true }).evaluate(button => (button as HTMLButtonElement).click());
  await expect(horizontal).toHaveCount(0);
  await expect(frame).not.toHaveAttribute('data-dragging');
  await page.mouse.up();

  await page.setViewportSize({ width: 360, height: 480 });
  await open(page, 'default', 'theme:light;palette:paper;motion:reduced');
  const vertical = page.getByRole('scrollbar', { name: '卷宗滚动区 纵向滚动', exact: true });
  await expect(vertical).toBeVisible();
  await expect(horizontal).toBeVisible();
  expect(await frame.evaluate(element => {
    const viewport = element.querySelector('.ui-scrollbar__viewport')!;
    const clip = viewport.getBoundingClientRect();
    const vertical = element.querySelector('.ui-scrollbar__thumb--y')!.getBoundingClientRect();
    const horizontal = element.querySelector('.ui-scrollbar__thumb--x')!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element.querySelector('.ui-scrollbar__content')!);
    const textOverThumb = [...range.getClientRects()].some(text => [vertical, horizontal].some(thumb =>
      Math.max(text.left, clip.left, thumb.left) < Math.min(text.right, clip.right, thumb.right) &&
      Math.max(text.top, clip.top, thumb.top) < Math.min(text.bottom, clip.bottom, thumb.bottom)
    ));
    return {
      height: element.getBoundingClientRect().height,
      separateRails: clip.right <= vertical.left && clip.bottom <= horizontal.top,
      textOverThumb,
    };
  })).toEqual({ height: 280, separateRails: true, textOverThumb: false });
  await horizontal.press('End');
  expect(await viewport.evaluate(element => element.scrollLeft === element.scrollWidth - element.clientWidth)).toBe(true);
  await vertical.press('End');
  expect(await viewport.evaluate(element => element.scrollTop === element.scrollHeight - element.clientHeight)).toBe(true);

  await open(page, 'dynamic-content');
  const image = page.getByRole('img', { name: '铜轨拓片' });
  const imageScroll = page.getByRole('scrollbar', { name: '图片宽度变化 横向滚动', exact: true });
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(180);
  await expect(imageScroll).toHaveCount(0);
  await page.getByRole('button', { name: '切换档案图片宽度', exact: true }).click();
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBe(900);
  const extent = await page.getByRole('region', { name: '图片宽度变化', exact: true }).evaluate(element => {
    return { max: element.scrollWidth - element.clientWidth, left: element.scrollLeft };
  });
  expect(extent.max).toBeGreaterThan(500);
  expect(extent.left).toBe(0);
  await expect(imageScroll).toHaveAttribute('aria-valuemax', String(extent.max));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await open(page, 'long-content', 'theme:dark;motion:reduced', '基础组件/Toast 轻提示');
  await page.locator('.kit-story-surface').evaluate(element => element.setAttribute('dir', 'rtl'));
  await page.getByRole('button', { name: '显示长消息', exact: true }).click();
  const toast = page.locator('.ui-toast');
  await expect(toast.locator('.ui-scrollbar')).toHaveAttribute('data-rtl', 'true');
  await expect(toast.locator('.ui-scrollbar__thumb--y')).toBeVisible();
  expect(await toast.evaluate(element => {
    const thumb = element.querySelector('.ui-scrollbar__thumb--y')!.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(element.querySelector('.ui-toast__title')!);
    return [...range.getClientRects()].some(rect => rect.left < thumb.right && rect.right > thumb.left && rect.top < thumb.bottom && rect.bottom > thumb.top);
  })).toBe(false);
  expect(errors).toEqual([]);
});
