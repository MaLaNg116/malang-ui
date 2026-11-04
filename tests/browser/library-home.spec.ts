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
async function openHome(page: Page, globals = 'theme:dark;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string }[];
  const story = entries.find(entry => entry.type === 'story' && entry.title === '开始/组件库展示首页' && entry.id.endsWith('--default'));
  expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
  await expect(page.getByRole('heading', { name: '以墨为骨，以动成章。', exact: true })).toBeVisible();
}
function feedback(page: Page) { return page.getByRole('region', { name: '本地请求反馈画面', exact: true }); }

test.describe('Library showcase home', () => {
  test('skips an actual brand intro and keeps cards readable before playback and when keyboard focus enters a stagger', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openHome(page, 'theme:dark;motion:standard');
    await page.getByRole('button', { name: '跳过开场', exact: true }).click();
    await expect(page.getByText('4.80 / 4.80s', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '播放开场', exact: true })).toBeVisible();
    const cards = page.locator('[data-motion-card]');
    await expect(cards).toHaveCount(4);
    expect(await cards.evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1'))).toBe(true);
    await expect(page.getByRole('article', { name: '落笔有度', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '重播列表入场', exact: false }).click();
    const entry = page.getByRole('link', { name: '体验素材归档', exact: false });
    await entry.focus(); await expect(entry).toBeFocused();
    await expect.poll(() => cards.evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1'))).toBe(true);
    await expect(page.getByText('内容已就位', { exact: true })).toBeVisible();
    await expect(entry).toHaveAttribute('href', './?path=/story/开始-藏品归档台--default');
    await page.setViewportSize({ width: 360, height: 800 });
    const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(geometry.scroll).toBe(geometry.viewport);
  });

  test('keeps a reduced-motion request genuinely pending, shows failure without a seal and stamps only a confirmed success', async ({ page }) => {
    await page.clock.install(); await openHome(page);
    const result = page.getByRole('combobox', { name: '演练结果', exact: true });
    const start = page.getByRole('button', { name: '开始请求演练', exact: false });
    const art = feedback(page); const stamp = art.locator('[data-home-sequence="seal"]');
    await result.selectOption('failure'); await start.click();
    await expect(page.getByRole('button', { name: '取消本轮', exact: true })).toBeFocused();
    await expect(art).toHaveAttribute('aria-busy', 'true'); await expect(result).toBeDisabled();
    await expect(stamp).toBeHidden(); await expect(page.getByRole('status')).toContainText('本地请求处理中');
    await page.clock.runFor(1700);
    await expect(page.getByRole('alert')).toContainText('演练请求失败'); await expect(stamp).toBeHidden();
    await expect(start).toBeFocused();
    await expect(page.getByText(/已确认 0 次成功响应/)).toBeVisible();
    await result.selectOption('success'); await start.click();
    const guide = page.getByRole('link', { name: '从接入指南开始', exact: false });
    await guide.focus();
    await page.clock.runFor(3100);
    await expect(art).toHaveAttribute('aria-busy', 'true'); await expect(stamp).toBeHidden();
    await page.clock.runFor(200);
    await expect(art).toHaveAttribute('aria-busy', 'false'); await expect(stamp).toBeVisible();
    await expect(guide).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: '响应已确认' })).toHaveCount(1);
    await expect(page.getByText(/已确认 1 次成功响应/)).toBeVisible();
    await expect(page.getByRole('button', { name: '取消本轮', exact: true })).toHaveCount(0);
  });

  test('preserves a live job through a system preference change and ignores a cancelled response after a newer success', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.clock.install();
    await openHome(page, 'theme:light;motion:standard');
    await page.getByRole('button', { name: '跳过开场', exact: true }).click();
    const result = page.getByRole('combobox', { name: '演练结果', exact: true });
    const start = page.getByRole('button', { name: '开始请求演练', exact: false });
    await result.selectOption('slow'); await start.click(); await page.clock.runFor(1000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(feedback(page)).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('status')).toContainText('本地请求处理中');
    await page.getByRole('button', { name: '取消本轮', exact: true }).press('Enter');
    await expect(page.getByRole('status')).toContainText('本轮已取消');
    await expect(start).toBeFocused();
    await expect(feedback(page).locator('[data-home-sequence="seal"]')).toBeHidden();
    await result.selectOption('success'); await start.click(); await page.clock.runFor(3300);
    await expect(page.getByRole('status')).toContainText('响应已确认');
    await expect(page.getByText(/已确认 1 次成功响应/)).toBeVisible();
    await page.clock.runFor(1200);
    await expect(page.getByRole('status')).toContainText('响应已确认');
    await expect(page.getByText(/已确认 1 次成功响应/)).toBeVisible();
  });
});
