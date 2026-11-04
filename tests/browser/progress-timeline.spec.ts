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
const progressTitle = '二级组件/Progress 进度条';
const timelineTitle = '二级组件/Timeline 时间线';

async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:reduced', args?: string) {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === title && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}${args ? `&args=${encodeURIComponent(args)}` : ''}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

async function noPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}

test.describe('Progress and timeline', () => {
  test('exposes labelled numeric progress, updates from real controls and leaves unknown progress indeterminate', async ({ page }) => {
    await openStory(page, progressTitle, 'Interactive');
    const progress = page.getByRole('progressbar', { name: '文档检查', exact: true });
    await expect(progress).toHaveAttribute('aria-valuemin', '0');
    await expect(progress).toHaveAttribute('aria-valuemax', '100');
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(progress).toHaveAttribute('aria-valuetext', '0%');
    const advance = page.getByRole('button', { name: '推进检查', exact: true });
    await advance.focus(); await page.keyboard.press('Enter');
    await expect(progress).toHaveAttribute('aria-valuenow', '25');
    await expect(progress).toHaveAttribute('aria-valuetext', '25%');
    await expect(advance).toBeFocused();
    for (let index = 0; index < 3; index++) await advance.click();
    await expect(progress).toHaveAttribute('aria-valuenow', '100');
    await expect(progress).toHaveAttribute('aria-valuetext', '100%，已完成');
    await advance.click(); await expect(progress).toHaveAttribute('aria-valuenow', '100');
    await page.getByRole('button', { name: '重置', exact: true }).click(); await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(page.getByRole('status')).toHaveCount(0);

    await openStory(page, progressTitle, 'InvalidValues');
    const clamped = page.getByRole('progressbar', { name: '铸刃进度', exact: true });
    await expect(clamped).toHaveAttribute('aria-valuemax', '100');
    await expect(clamped).toHaveAttribute('aria-valuenow', '0');
    await expect(clamped).toHaveAttribute('aria-valuetext', '0%');
    await openStory(page, progressTitle, 'Default', 'theme:light;motion:reduced', 'value:150;max:80');
    await expect(clamped).toHaveAttribute('aria-valuemax', '80');
    await expect(clamped).toHaveAttribute('aria-valuenow', '80');
    await expect(clamped).toHaveAttribute('aria-valuetext', '100%');

    await openStory(page, progressTitle, 'Error');
    const error = page.getByRole('progressbar', { name: '构建检查', exact: true });
    await expect(error).toHaveAttribute('aria-valuenow', '68');
    await expect(error).toHaveAttribute('aria-valuetext', '68%，发生错误');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await openStory(page, progressTitle, 'Indeterminate');
    const unknown = page.getByRole('progressbar', { name: '正在准备资料', exact: true });
    await expect(unknown).not.toHaveAttribute('aria-valuenow');
    await expect(unknown).toHaveAttribute('aria-valuetext', '正在处理');
    await expect(page.getByText('处理中', { exact: true })).toBeVisible();
    await expect(page.getByText(/\d+%/)).toHaveCount(0);
  });

  test('stops indefinite and state-change motion from either preference source and keeps progress visible in forced colors', async ({ page }) => {
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      const globals = `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`;
      await openStory(page, progressTitle, 'Indeterminate', globals);
      const progress = page.getByRole('progressbar', { name: '正在准备资料', exact: true });
      const motion = await progress.locator('.ui-progress__fill').evaluate(element => ({ animation: getComputedStyle(element).animationName, transition: getComputedStyle(element).transitionDuration }));
      expect(motion.animation).toBe('none');
      expect(motion.transition.split(',').every(duration => parseFloat(duration) === 0)).toBe(true);
      await expect(progress).not.toHaveAttribute('aria-valuenow');
      await openStory(page, timelineTitle, 'Default', globals);
      const active = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: '校准细节', exact: true }) });
      expect(await active.locator('.ui-timeline__node').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    }

    await page.emulateMedia({ forcedColors: 'active' });
    await openStory(page, progressTitle, 'Default', 'theme:dark;motion:reduced');
    const progress = page.getByRole('progressbar', { name: '铸刃进度', exact: true });
    const colors = await progress.evaluate(element => {
      const fill = element.querySelector('.ui-progress__fill')!;
      const probe = element.ownerDocument.createElement('span'); probe.style.backgroundColor = 'Highlight'; element.append(probe);
      const result = { borderStyle: getComputedStyle(element).borderTopStyle, borderWidth: getComputedStyle(element).borderTopWidth, fill: getComputedStyle(fill).backgroundColor, highlight: getComputedStyle(probe).backgroundColor };
      probe.remove(); return result;
    });
    expect(colors.borderStyle).toBe('solid'); expect(parseFloat(colors.borderWidth)).toBeGreaterThan(0); expect(colors.fill).toBe(colors.highlight);
    await expect(progress).toHaveAttribute('aria-valuenow', '42');
    await openStory(page, timelineTitle, 'Default', 'theme:dark;motion:reduced');
    await expect(page.getByRole('region', { name: '交付记录', exact: true }).getByRole('listitem')).toHaveCount(3);
    await expect(page.getByText('进行中', { exact: true })).toBeVisible();
  });

  test('keeps ordered records, machine-readable times and textual states while slot actions retain their own focus', async ({ page }) => {
    await openStory(page, timelineTitle);
    const timeline = page.getByRole('region', { name: '交付记录', exact: true });
    const list = timeline.getByRole('list'); expect(await list.evaluate(element => element.tagName)).toBe('OL');
    const records = list.getByRole('listitem'); await expect(records).toHaveCount(3);
    await expect(records.nth(0).getByRole('heading', { level: 3 })).toHaveText('整理素材');
    await expect(records.nth(1).getByRole('heading', { level: 3 })).toHaveText('校准细节');
    await expect(records.nth(2).getByRole('heading', { level: 3 })).toHaveText('落印交付');
    await expect(timeline.locator('time')).toHaveCount(2);
    await expect(records.nth(0).locator('time')).toHaveText('09:20');
    await expect(records.nth(0).locator('time')).toHaveAttribute('datetime', '2026-11-04T09:20:00+08:00');
    await expect(records.nth(1).locator('time')).toHaveAttribute('datetime', '2026-11-04T09:35:00+08:00');
    await expect(records.nth(0).getByText('已完成', { exact: true })).toBeVisible();
    await expect(records.nth(1).getByText('进行中', { exact: true })).toBeVisible();
    await expect(records.nth(2).getByText('等待', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await openStory(page, timelineTitle, 'Error');
    const failed = timeline.getByRole('listitem').filter({ has: page.getByRole('heading', { name: '检查未完成', exact: true }) });
    await expect(failed.getByText('异常', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

    await openStory(page, timelineTitle, 'WithAction');
    const action = page.getByRole('button', { name: '重新校准', exact: true });
    await action.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('已请求重新校准。');
    await expect(action).toBeFocused();
    expect(await action.evaluate(element => element.closest('li')?.getAttribute('role'))).toBeNull();
    await openStory(page, timelineTitle, 'Empty');
    await expect(timeline.getByRole('heading', { name: '暂无记录', exact: true })).toBeVisible();
    await expect(timeline.getByRole('list')).toHaveCount(0);
    await expect(timeline.getByRole('button')).toHaveCount(0);
  });

  test('wraps long records and progress labels at 360px without truncating content or widening the page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (const theme of ['light', 'dark']) {
      await openStory(page, timelineTitle, 'LongContent', `theme:${theme};motion:reduced`);
      const timeline = page.getByRole('region', { name: '交付记录', exact: true });
      const title = timeline.getByRole('heading', { level: 3 });
      await expect(title).toHaveText('ArchiveWithoutArtificialTruncation'.repeat(3));
      await expect(timeline.locator('time')).toHaveText('2026-11-04 10:30');
      await expect(timeline.locator('time')).not.toHaveAttribute('datetime');
      await expect(timeline.getByText('一段完整的项目记录，应当在窄屏自然换行，同时保留可读的层次与留白。'.repeat(3), { exact: true })).toBeVisible();
      await noPageOverflow(page);
      const label = 'ProgressLabelWithoutArtificialClipping'.repeat(3);
      await openStory(page, progressTitle, 'Default', `theme:${theme};motion:reduced`, `label:${label}`);
      await expect(page.getByRole('progressbar', { name: label, exact: true })).toHaveAttribute('aria-valuenow', '42');
      await noPageOverflow(page);
    }
  });
});
