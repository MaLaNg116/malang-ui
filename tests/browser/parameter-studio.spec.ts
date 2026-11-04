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
async function openStudio(page: Page, globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '开始/归印调校台' && (entry.exportName === 'Default' || entry.id.endsWith('--default')));
  expect(story, 'The parameter studio story exists').toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await expect(page.getByRole('heading', { name: '毫厘之间，自有锋芒。', level: 1, exact: true })).toBeVisible();
}
function appliedValue(page: Page, label: string) {
  return page.getByRole('region', { name: '已应用参数', exact: true }).getByRole('term').filter({ hasText: label }).locator('..').getByRole('definition');
}
async function expectNoOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}

test.describe('Parameter studio', () => {
  test('selects and calibrates a draft, removes a keyword with a focus fallback, then applies one completed impression', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openStudio(page);
    await expect(appliedValue(page, '基底预设')).toHaveText('机关 · 均衡');
    await expect(appliedValue(page, '力度')).toHaveText('1.00');
    await expect(appliedValue(page, '速度')).toHaveText('1.0×');
    const combo = page.getByRole('combobox', { name: '选择基底', exact: true });
    await combo.fill('朱砂');
    await expect(page.getByRole('option', { name: '朱砂 · 凌厉', exact: true })).toBeVisible();
    // Both the balanced description and bold label contain 朱砂; choose the second result explicitly.
    await combo.press('ArrowDown');
    await expect(page.getByRole('option', { name: '朱砂 · 凌厉', exact: true })).toHaveAttribute('aria-selected', 'true');
    await combo.press('Enter');
    await expect(combo).toHaveValue('朱砂 · 凌厉');
    const amplitude = page.getByRole('spinbutton', { name: '力度数值', exact: true });
    const speed = page.getByRole('spinbutton', { name: '速度数值', exact: true });
    await expect(amplitude).toHaveValue('1.55'); await expect(speed).toHaveValue('1.3');
    const amplitudeRail = page.getByRole('slider', { name: '力度刻度', exact: true });
    await amplitudeRail.focus(); await page.keyboard.press('ArrowRight');
    await expect(amplitudeRail).toHaveValue('1.6'); await expect(amplitude).toHaveValue('1.6');
    await speed.fill('1.4'); await expect(page.getByRole('slider', { name: '速度刻度', exact: true })).toHaveValue('1.4');
    await page.getByRole('textbox', { name: '预设名称', exact: true }).fill('归印 · 朱砂修订');
    await page.getByRole('button', { name: '移除切面展开', exact: true }).click();
    await expect(page.getByRole('button', { name: '移除切面展开', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '移除朱砂落印', exact: true })).toBeFocused();
    await expect(page.getByText('待应用', { exact: true })).toBeVisible();
    // Draft edits leave the running preview and its applied metadata untouched.
    await expect(appliedValue(page, '已应用名称')).toHaveText('归印 · 均衡');
    await expect(appliedValue(page, '力度')).toHaveText('1.00'); await expect(appliedValue(page, '速度')).toHaveText('1.0×');
    await page.getByRole('button', { name: '应用并预览', exact: true }).click();
    await expect(appliedValue(page, '基底预设')).toHaveText('朱砂 · 凌厉');
    await expect(appliedValue(page, '已应用名称')).toHaveText('归印 · 朱砂修订');
    await expect(appliedValue(page, '力度')).toHaveText('1.60'); await expect(appliedValue(page, '速度')).toHaveText('1.4×');
    await expect(appliedValue(page, '归档关键词')).toHaveText('朱砂落印 · 疾出归位');
    await expect(appliedValue(page, '预计播放时长')).toHaveText('静态完成态');
    await expect(page.getByText('已应用', { exact: true })).toBeVisible();
    await expect(page.getByRole('slider', { name: '编排进度', exact: true })).toHaveValue('3.6');
    const toast = page.getByRole('group', { name: '印记已成', exact: true });
    await expect(toast).toBeVisible();
    const announcement = page.getByRole('status').filter({ hasText: '归印 · 朱砂修订' });
    await expect(announcement).toHaveCount(1);
    await expect(announcement).toHaveText('印记已成 归印 · 朱砂修订 · 力度 1.60，速度 1.4×。');
    await expect(page.getByRole('button', { name: '应用并预览', exact: true })).toBeFocused();
    await combo.fill('墨线');
    await expect(page.getByRole('option', { name: '墨线 · 沉静', exact: true })).toBeVisible();
    await combo.press('Enter'); await expect(amplitude).toHaveValue('0.65');
    const restoreDraft = page.getByRole('button', { name: '还原草稿', exact: true });
    await expect(restoreDraft).toBeEnabled();
    await expect(appliedValue(page, '已应用名称')).toHaveText('归印 · 朱砂修订');
    await restoreDraft.click();
    await expect(combo).toHaveValue('朱砂 · 凌厉');
    await expect(page.getByRole('textbox', { name: '预设名称', exact: true })).toHaveValue('归印 · 朱砂修订');
    await expect(amplitude).toHaveValue('1.6'); await expect(speed).toHaveValue('1.4');
    await expect(page.getByRole('button', { name: /^移除/ })).toHaveCount(2);
    await expect(page.getByText('已应用', { exact: true })).toBeVisible(); await expect(restoreDraft).toBeDisabled();
    await expect(appliedValue(page, '力度')).toHaveText('1.60'); await expect(appliedValue(page, '速度')).toHaveText('1.4×');
    await expect(appliedValue(page, '归档关键词')).toHaveText('朱砂落印 · 疾出归位');
  });

  test('validates an empty numeric draft on mobile and restores keywords without silently changing applied parameters', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openStudio(page, 'theme:dark;motion:reduced');
    const amplitude = page.getByRole('spinbutton', { name: '力度数值', exact: true });
    await amplitude.fill(''); await expect(amplitude).toHaveValue('');
    await page.getByRole('button', { name: '应用并预览', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: '力度需在 0.6 至 1.8 之间。' })).toBeVisible();
    await expect(amplitude).toHaveAttribute('aria-invalid', 'true'); await expect(amplitude).toBeFocused();
    await expect(appliedValue(page, '力度')).toHaveText('1.00');
    await amplitude.fill('1.25');
    await page.getByRole('spinbutton', { name: '速度数值', exact: true }).fill('1.1');
    await page.getByRole('textbox', { name: '预设名称', exact: true }).fill('归印 · 触屏校准');
    for (const tag of ['机械归位', '朱砂落印', '墨纹回响']) await page.getByRole('button', { name: '移除' + tag, exact: true }).click();
    const restore = page.getByRole('button', { name: '恢复关键词', exact: true });
    await expect(restore).toBeFocused();
    await expect(page.getByText('尚未添加关键词。', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '应用并预览', exact: true }).click();
    await expect(appliedValue(page, '力度')).toHaveText('1.25'); await expect(appliedValue(page, '速度')).toHaveText('1.1×');
    await expect(appliedValue(page, '已应用名称')).toHaveText('归印 · 触屏校准');
    await expect(appliedValue(page, '归档关键词')).toHaveText('未添加');
    await restore.click();
    await expect(page.getByRole('button', { name: /^移除/ })).toHaveCount(3);
    await expect(page.getByText('待应用', { exact: true })).toBeVisible();
    await expect(appliedValue(page, '归档关键词')).toHaveText('未添加');
    await page.getByRole('button', { name: '应用并预览', exact: true }).click();
    await expect(appliedValue(page, '归档关键词')).toHaveText('机械归位 · 朱砂落印 · 墨纹回响');
    await expect(page.getByText('已应用', { exact: true })).toBeVisible();
    await expectNoOverflow(page);
    const image = page.getByRole('img', { name: '机械合轨与朱砂成章印记', exact: true });
    const box = (await image.boundingBox())!; expect(box.width).toBeGreaterThan(0); expect(box.width).toBeLessThanOrEqual(360);
  });

  test('plays and pauses the real sequence, seeks a stamp phase and settles when the system requests reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openStudio(page, 'theme:dark;motion:standard');
    const progress = page.getByRole('slider', { name: '编排进度', exact: true });
    await expect(progress).toHaveValue('0');
    await page.getByRole('button', { name: '播放编排', exact: true }).click();
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(.05);
    await page.getByRole('button', { name: '暂停编排', exact: true }).click();
    const paused = await progress.inputValue(); await page.waitForTimeout(160); await expect(progress).toHaveValue(paused);
    await progress.fill('1.85'); await expect(progress).toHaveValue('1.85');
    await expect(page.getByText('落印 · 朱砂成形', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '播放编排', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '查看落印', exact: true }).click();
    await expect(progress).toHaveValue('3.6'); await expect(page.getByText('回响 · 成章归位', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '重播', exact: true }).click();
    await expect(page.getByRole('button', { name: '暂停编排', exact: true })).toBeVisible();
    await expect.poll(async () => Number(await progress.inputValue())).toBeLessThan(3.6);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(progress).toHaveValue('3.6');
    await expect(page.getByRole('button', { name: '播放编排', exact: true })).toBeVisible();
    await expect(page.getByText('减少动态效果：直接显示完成态，也可以拖动进度静态查看各阶段。', { exact: true })).toBeVisible();
    await expect(appliedValue(page, '预计播放时长')).toHaveText('静态完成态');
    await page.waitForTimeout(160); await expect(progress).toHaveValue('3.6');
  });
});
