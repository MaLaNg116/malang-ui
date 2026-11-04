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
const statisticsTitle = '基础组件/Statistic 指标';
const resultTitle = '二级组件/Result 结果面板';
async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;palette:paper;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json() as { entries: Record<string, StoryEntry> }).entries);
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = entries.find(entry => entry.type === 'story' && entry.title === title && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

test.describe('Static statistics and page results', () => {
  test('preserves native term and definition semantics, formatted values, zero and honest placeholders without live counters', async ({ page }) => {
    await openStory(page, statisticsTitle);
    const statistic = page.getByRole('group', { name: '本地归档', exact: true });
    await expect(statistic.locator('dl')).toHaveCount(1);
    await expect(statistic.getByRole('term')).toHaveText('本地归档');
    await expect(statistic.getByRole('definition')).toHaveText(/128\s*份/);
    await expect(statistic).toHaveAccessibleDescription('当前工作区已登记的资料。');
    await expect(page.getByRole('status')).toHaveCount(0); await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(statistic).not.toHaveAttribute('aria-live'); await expect(statistic.locator('output')).toHaveCount(0);
    await openStory(page, statisticsTitle, 'FormattedValues');
    await expect(page.getByRole('group', { name: '本次用量', exact: true }).getByRole('definition')).toHaveText(/64\s*MB/);
    await expect(page.getByRole('group', { name: '预算上限', exact: true }).getByRole('definition')).toHaveText(/¥\s*12,800\s*\/ 月/);
    await expect(page.getByRole('group', { name: '资料完整度', exact: true }).getByRole('definition')).toHaveText(/98\.4\s*%/);
    await openStory(page, statisticsTitle, 'Placeholder');
    await expect(page.getByRole('group', { name: '待汇总条目', exact: true }).getByRole('definition')).toHaveText('待汇总');
    await expect(page.getByRole('group', { name: '已撤回条目', exact: true }).getByRole('definition')).toHaveText(/0\s*项/);
    await expect(page.getByRole('group', { name: '未返回用量', exact: true }).getByRole('definition')).toHaveText('—');
    await expect(page.getByText('NaN', { exact: true })).toHaveCount(0);
  });

  test('keeps page results quiet by default and limits an explicit announcement to the result message', async ({ page }) => {
    for (const [story, title, level] of [
      ['Default', '归档已成，资料有序。', 2], ['Error', '这次归档未能完成。', 2],
      ['Warning', '还有一处资料需要确认。', 2], ['Info', '本轮资料已转交复核。', 1],
    ] as const) {
      await openStory(page, resultTitle, story);
      const result = page.getByRole('region', { name: title, exact: true });
      expect(await result.evaluate(element => element.tagName)).toBe('SECTION');
      await expect(result.getByRole('heading', { name: title, exact: true, level })).toBeVisible();
      await expect(result).not.toHaveAttribute('aria-live');
      await expect(page.getByRole('alert')).toHaveCount(0); await expect(page.getByRole('status')).toHaveCount(0);
      await expect(result.getByRole('img')).toHaveCount(0); await expect(result.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    }
    await openStory(page, resultTitle, 'WithActions');
    await page.getByRole('button', { name: '切换结果播报', exact: true }).click();
    const alert = page.getByRole('alert', { name: '需要再核对一处资料。', exact: true });
    await expect(alert).toHaveCount(1); await expect(alert).toHaveAttribute('aria-live', 'assertive');
    await expect(alert).toContainText('请核对附件来源，然后确认本次归档。');
    await expect(alert).not.toContainText('动作记录'); await expect(alert.getByRole('button')).toHaveCount(0);
    await page.getByRole('button', { name: '切换结果状态', exact: true }).click();
    const status = page.getByRole('status', { name: '复核通过，资料已归档。', exact: true });
    await expect(status).toHaveCount(1); await expect(status).toHaveAttribute('aria-live', 'polite'); await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(status).not.toContainText('动作记录'); await expect(status.getByRole('button')).toHaveCount(0);
  });

  test('preserves native footer submissions, custom action focus, host controls and outside drafts during owner updates', async ({ page }) => {
    await openStory(page, resultTitle, 'WithActions');
    const submit = page.getByRole('button', { name: '确认归档', exact: true });
    expect(await submit.evaluate(element => element.tagName)).toBe('BUTTON'); await expect(submit).toHaveAttribute('type', 'submit');
    await submit.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: '复核通过，资料已归档。', exact: true })).toBeVisible();
    await expect(page.getByText('动作记录：已确认归档 · 表单提交：1 次', { exact: true })).toBeVisible(); await expect(submit).toBeFocused();
    const back = page.getByRole('button', { name: '返回列表', exact: true });
    await expect(back).toHaveAttribute('type', 'button'); await back.focus(); await page.keyboard.press('Space');
    await expect(page.getByText('动作记录：已返回列表 · 表单提交：1 次', { exact: true })).toBeVisible(); await expect(back).toBeFocused();
    const rules = page.getByRole('link', { name: '查看归档规则', exact: true }); await expect(rules).toHaveAttribute('href', '#result-guide');
    await rules.focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/#result-guide$/);
    const note = page.getByRole('textbox', { name: '结果旁备注', exact: true }); await note.fill('保留这段备注');
    await page.getByRole('button', { name: '切换结果状态', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(note).toBeFocused(); await expect(note).toHaveValue('保留这段备注');
    await expect(page.getByRole('region', { name: '需要再核对一处资料。', exact: true })).toBeVisible();
    const native = page.getByRole('button', { name: '宿主原生按钮', exact: true });
    expect(await native.evaluate(element => getComputedStyle(element).borderTopStyle)).not.toBe('none');
    expect(await native.evaluate(element => Number.parseFloat(getComputedStyle(element).borderTopWidth))).toBeGreaterThan(0);
    await native.click(); await expect(page.getByText('宿主点击：1', { exact: true })).toBeVisible();
    const checkbox = page.getByRole('checkbox', { name: '宿主确认框', exact: true }); await checkbox.check(); await expect(checkbox).toBeChecked();
    expect(await checkbox.evaluate(element => getComputedStyle(element).appearance)).not.toBe('none');
    await openStory(page, statisticsTitle, 'SnapshotChange');
    const statisticNote = page.getByRole('textbox', { name: '指标旁备注', exact: true }); await statisticNote.fill('快照更新后仍在编辑');
    await page.getByRole('button', { name: '载入下一份快照', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(page.getByRole('group', { name: '已登记条目', exact: true }).getByRole('definition')).toHaveText(/64\s*份/);
    await expect(statisticNote).toBeFocused(); await expect(statisticNote).toHaveValue('快照更新后仍在编辑'); await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('wraps long values and page content at 360px in each light palette and dark mode, with reduced motion and forced colors', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
    const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      for (const [theme, palette, source] of [['light', 'paper', 'container'], ['light', 'celadon', 'system'], ['light', 'gilt', 'container'], ['dark', 'paper', 'system']] as const) {
        await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
        const globals = `theme:${theme};palette:${palette};motion:${source === 'container' ? 'reduced' : 'standard'}`;
        await openStory(page, statisticsTitle, 'LongContent', globals);
        const statistic = page.getByRole('group', { name: 'ArchiveMetricLabelWithoutArtificialTruncation', exact: true });
        await expect(statistic.getByRole('definition')).toContainText('123456789012345678901234567890.0123456789');
        expect(await statistic.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
        await openStory(page, resultTitle, 'LongContent', globals);
        const result = page.getByRole('region', { name: 'ArchiveResultTitleWithoutArtificialClippingOrTruncation', exact: true });
        await expect(result).toBeVisible(); await expect(result).toContainText('ArchiveResultDescriptionWithoutArtificialTruncation'.repeat(4));
        expect(await result.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
        const button = result.getByRole('button').first(); const box = (await button.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
        await expect(result).not.toHaveAttribute('aria-live'); await expect(page.getByRole('alert')).toHaveCount(0); await expect(page.getByRole('status')).toHaveCount(0);
      }
      await page.emulateMedia({ forcedColors: 'active' });
      const result = page.getByRole('region', { name: 'ArchiveResultTitleWithoutArtificialClippingOrTruncation', exact: true });
      expect(await result.evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
      await page.keyboard.press('Tab'); await expect(result.getByRole('button').first()).toBeFocused();
      expect(await result.getByRole('button').first().evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
      await openStory(page, statisticsTitle, 'LongContent', 'theme:light;palette:gilt;motion:reduced');
      const statistic = page.getByRole('group', { name: 'ArchiveMetricLabelWithoutArtificialTruncation', exact: true });
      expect(await statistic.evaluate(element => getComputedStyle(element).borderBottomStyle)).toBe('solid');
      await expect(statistic.getByRole('definition')).toContainText('123456789012345678901234567890.0123456789');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
