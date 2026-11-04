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
async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const entries = (await response.json() as { entries: Record<string, StoryEntry> }).entries;
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(entries).find(entry => entry.type === 'story' && entry.title === title && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function noPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}

test.describe('Tags on touch displays', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 360, height: 800 } });
  test('removes tags by keyboard, follows the owner focus policy and retains disabled and coarse targets', async ({ page }) => {
    await openStory(page, '基础组件/Tag 标签', 'Closable', 'theme:dark;motion:reduced');
    const first = page.getByRole('button', { name: '移除墨线构形', exact: true });
    await expect(first).toHaveAccessibleDescription('墨线构形');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const box = await first.boundingBox();
    expect(box).not.toBeNull(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
    await first.focus(); await page.keyboard.press('Enter');
    await expect(first).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('已移除：墨线构形');
    const next = page.getByRole('button', { name: '移除朱砂落印', exact: true });
    await expect(next).toBeFocused();
    await page.keyboard.press('Space');
    const last = page.getByRole('button', { name: '移除机械归位', exact: true });
    await expect(next).toHaveCount(0); await expect(last).toBeFocused();
    await page.keyboard.press('Enter');
    const restore = page.getByRole('button', { name: '恢复标签', exact: true });
    await expect(last).toHaveCount(0); await expect(restore).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('status')).toHaveText('标签已恢复。');
    await expect(page.getByRole('button', { name: /^移除/ })).toHaveCount(3);
    await expect(restore).toBeFocused();
    await noPageOverflow(page);

    await openStory(page, '基础组件/Tag 标签', 'Disabled', 'theme:dark;motion:reduced');
    const disabled = page.getByRole('button', { name: '移除墨线构形', exact: true });
    await expect(disabled).toBeDisabled(); await disabled.focus(); await expect(disabled).not.toBeFocused();
    await expect(page.getByText('墨线构形', { exact: true })).toBeVisible();
    await openStory(page, '基础组件/Tag 标签', 'LongContent', 'theme:dark;motion:reduced');
    await expect(page.getByText('ArchiveWithoutArtificialClippingOrTruncationWithAMuchLongerKeyword', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '移除长标签', exact: true })).toBeEnabled();
    await noPageOverflow(page);
  });
});

test('recovers an avatar image after a failed source and provides one name or a decorative alternative', async ({ page }) => {
  await openStory(page, '基础组件/Avatar 头像', 'SourceChange');
  const avatar = page.getByRole('img', { name: '可以重新加载的工坊头像', exact: true });
  await expect(avatar).toHaveCount(1); await expect(page.getByRole('img')).toHaveCount(1);
  await expect(avatar.getByText('工坊', { exact: true })).toBeVisible();
  await expect(avatar.locator('img')).toHaveCount(0);
  const change = page.getByRole('button', { name: '切换图片来源', exact: true });
  await change.focus(); await page.keyboard.press('Enter');
  const image = avatar.locator('img');
  await expect(image).toHaveCount(1);
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await expect(avatar.getByText('工坊', { exact: true })).toBeHidden();
  await expect(page.getByRole('img')).toHaveCount(1);
  await expect(avatar).toHaveAccessibleName('可以重新加载的工坊头像');
  await expect(change).toBeFocused();
  await change.click();
  await expect(avatar.locator('img')).toHaveCount(0);
  await expect(avatar.getByText('工坊', { exact: true })).toBeVisible();
  await expect(page.getByRole('img')).toHaveCount(1);
  await openStory(page, '基础组件/Avatar 头像', 'Decorative');
  await expect(page.getByRole('img')).toHaveCount(0);
});

test('keeps description-list semantics and independent slot actions while empty and long records remain readable', async ({ page }) => {
  const title = '二级组件/Descriptions 资料描述';
  await openStory(page, title);
  const descriptions = page.getByRole('region', { name: '预设档案', exact: true });
  await expect(descriptions.locator('dl')).toHaveCount(1);
  await expect(descriptions.getByRole('term')).toHaveCount(5);
  await expect(descriptions.getByRole('definition')).toHaveCount(5);
  await expect(descriptions.getByRole('term').first()).toHaveText('档案名称');
  await expect(descriptions.getByRole('definition').first()).toHaveText('归印 · 交互调校');
  await expect(descriptions.getByRole('definition').last()).toHaveText('墨色、刻印与机械滑轨，共同构成一份完整的交互档案。');
  await expect(descriptions.getByRole('button')).toHaveCount(0);
  await openStory(page, title, 'WithSlots');
  const archive = descriptions.getByRole('button', { name: '归档资料', exact: true });
  await archive.focus(); await page.keyboard.press('Enter');
  await expect(descriptions.getByText('已归档', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('这份资料已归档。');
  await expect(archive).toBeFocused();
  await expect(descriptions).not.toHaveAttribute('aria-live');
  await openStory(page, title, 'Empty');
  await expect(descriptions.getByRole('heading', { name: '预设档案', exact: true })).toBeVisible();
  await expect(descriptions.getByText('暂无资料。', { exact: true })).toBeVisible();
  await expect(descriptions.locator('dl')).toHaveCount(0);
  await expect(descriptions.getByRole('term')).toHaveCount(0);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const theme of ['light', 'dark']) {
    await openStory(page, title, 'LongContent', `theme:${theme};motion:reduced`);
    await expect(descriptions.getByRole('term').first()).toHaveText('ArchiveLabelWithoutArtificialClipping');
    await expect(descriptions.getByRole('definition').first()).toHaveText('ReferenceWithoutArtificialTruncation'.repeat(5));
    await expect(descriptions.getByRole('definition').last()).toHaveText('—');
    await noPageOverflow(page);
  }
});
