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

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const [theme, palette] of [['light', 'paper'], ['light', 'celadon'], ['light', 'gilt'], ['dark', 'gilt']]) {
      await openStory(page, progressTitle, 'StateComparison', `theme:${theme};palette:${palette};motion:standard`);
      await expect(page.getByRole('progressbar')).toHaveCount(7);
      // Batch actual paints and state semantics together. Resolve the gradient's
      // final painted stop as a color instead of asserting a custom-property name.
      const comparison = await page.locator('#storybook-root .kit-story-surface').evaluate(surface => {
        const probe = document.createElement('span'); probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'; surface.append(probe);
        function resolve(value: string) {
          probe.style.color = ''; probe.style.color = value;
          if (!probe.style.color) throw new Error(`Unresolved state color: ${value}`);
          return getComputedStyle(probe).color;
        }
        function gradientEnd(image: string) {
          let depth = 0, lastComma = -1;
          for (let index = 0; index < image.length; index++) {
            if (image[index] === '(') depth++;
            else if (image[index] === ')') depth--;
            else if (image[index] === ',' && depth === 1) lastComma = index;
          }
          if (lastComma < 0) throw new Error(`Expected a painted progress gradient: ${image}`);
          return resolve(image.slice(lastComma + 1, -1).trim().replace(/\s+-?[\d.]+(?:%|px)$/, ''));
        }
        try {
          const tokens = { info: resolve('var(--ui-color-info)'), error: resolve('var(--ui-color-danger)'), success: resolve('var(--ui-color-success)'), focus: resolve('var(--ui-color-focus)') };
          const progress = Object.fromEntries([...surface.querySelectorAll('.ui-progress')].map(root => {
            const label = root.querySelector('.ui-progress__label')!, track = root.querySelector('[role="progressbar"]')!, fill = root.querySelector('.ui-progress__fill')!;
            const value = root.querySelector('.ui-progress__value'), glyph = root.querySelector('.ui-progress__status');
            return [label.textContent!.trim(), {
              labelled: track.getAttribute('aria-labelledby') === label.id, min: track.getAttribute('aria-valuemin'), max: track.getAttribute('aria-valuemax'), now: track.getAttribute('aria-valuenow'), valueText: track.getAttribute('aria-valuetext'),
              visibleValue: value?.textContent?.trim() || '', valueColor: value && getComputedStyle(value).color, fillColor: gradientEnd(getComputedStyle(fill).backgroundImage), animation: getComputedStyle(fill).animationName,
              glyphCount: root.querySelectorAll('.ui-progress__status').length, glyphHidden: glyph?.getAttribute('aria-hidden'), glyphFocusable: glyph?.getAttribute('focusable'), glyphColor: glyph && getComputedStyle(glyph).stroke, glyphPath: glyph?.querySelector('path')?.getAttribute('d'),
              liveRegions: root.querySelectorAll('[role="status"], [role="alert"], [aria-live]').length,
            }];
          }));
          const timelineRoot = surface.querySelector('.ui-timeline')!;
          const timeline = Object.fromEntries([...timelineRoot.querySelectorAll('.ui-timeline__item')].map(item => {
            const node = item.querySelector('.ui-timeline__node')!, state = item.querySelector('.ui-timeline__state')!, dot = item.querySelector('.ui-timeline__dot'), glyph = node.querySelector('path');
            return [item.getAttribute('data-status')!, { text: state.textContent?.trim(), nodeColor: getComputedStyle(node).color, stateColor: getComputedStyle(state).color, nodeHidden: node.getAttribute('aria-hidden'), dotColor: dot && getComputedStyle(dot).backgroundColor, glyphColor: glyph && getComputedStyle(glyph).stroke, glyphPath: glyph?.getAttribute('d') }];
          }));
          const stepsRoot = surface.querySelector('.ui-steps')!;
          const steps = [...stepsRoot.querySelectorAll('.ui-steps__item')].map(item => ({ current: item.querySelector('.ui-steps__node')?.getAttribute('aria-current'), state: item.querySelector('.ui-steps__sr-only')?.textContent?.trim(), sealColor: getComputedStyle(item.querySelector('.ui-steps__seal')!).color, sealHidden: item.querySelector('.ui-steps__seal')?.getAttribute('aria-hidden') }));
          return { tokens, progress, timeline, steps, timelineLabel: timelineRoot.getAttribute('aria-label'), stepsLabel: stepsRoot.getAttribute('aria-label') };
        } finally { probe.remove(); }
      });
      const { tokens, progress: painted, timeline, steps } = comparison;
      expect(new Set([tokens.info, tokens.error, tokens.success]).size).toBe(3);
      const channels = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const [infoR, infoG, infoB] = channels(tokens.info), [errorR, errorG, errorB] = channels(tokens.error), [successR, successG, successB] = channels(tokens.success);
      expect(infoB!).toBeGreaterThan(infoG!); expect(infoG!).toBeGreaterThan(infoR!);
      expect(errorR!).toBeGreaterThan(Math.max(errorG!, errorB!)); expect(successG!).toBeGreaterThan(Math.max(successR!, successB!));
      for (const [label, color, now, valueText, visibleValue] of [
        ['进行中进度', tokens.info, '42', '42%', '42%'],
        ['异常进度', tokens.error, '68', '68%，发生错误', '中断 · 68%'],
        ['完成进度', tokens.success, '100', '100%，已完成', '100%'],
      ]) {
        const sample = painted[label!]!;
        expect(sample.labelled).toBe(true); expect(sample.min).toBe('0'); expect(sample.max).toBe('100'); expect(sample.now).toBe(now);
        expect(sample.valueText).toBe(valueText); expect(sample.visibleValue).toBe(visibleValue); expect(sample.valueColor).toBe(color); expect(sample.fillColor).toBe(color); expect(sample.liveRegions).toBe(0);
      }
      expect(painted['进行中进度']!.glyphCount).toBe(0);
      for (const [label, color] of [['异常进度', tokens.error], ['完成进度', tokens.success], ['仅图形异常进度', tokens.error], ['仅图形完成进度', tokens.success]]) {
        const sample = painted[label!]!;
        expect(sample.glyphCount).toBe(1); expect(sample.glyphHidden).toBe('true'); expect(sample.glyphFocusable).toBe('false'); expect(sample.glyphColor).toBe(color); expect(sample.glyphPath).toBeTruthy();
      }
      expect(painted['异常进度']!.glyphPath).not.toBe(painted['完成进度']!.glyphPath);
      expect(painted['仅图形异常进度']!.visibleValue).toBe(''); expect(painted['仅图形异常进度']!.valueText).toBe('68%，发生错误');
      expect(painted['仅图形完成进度']!.visibleValue).toBe(''); expect(painted['仅图形完成进度']!.valueText).toBe('100%，已完成');
      for (const [label, valueText, visibleValue, color] of [['异常进度未知', '处理出错，进度未知', '已中断', tokens.error], ['完成进度未知', '已完成', '已完成', tokens.success]]) {
        const sample = painted[label!]!;
        expect(sample.now).toBeNull(); expect(sample.valueText).toBe(valueText); expect(sample.visibleValue).toBe(visibleValue); expect(sample.visibleValue).not.toMatch(/\d+%/);
        expect(sample.animation).toBe('none'); expect(sample.fillColor).toBe(color); expect(sample.glyphCount).toBe(1); expect(sample.glyphHidden).toBe('true');
      }
      expect(comparison.timelineLabel).toBe('状态对照时间线'); expect(Object.keys(timeline)).toHaveLength(3);
      for (const [status, text, color] of [['active', '进行中', tokens.info], ['error', '异常', tokens.error], ['success', '已完成', tokens.success]]) {
        const item = timeline[status!]!;
        expect(item.text).toBe(text); expect(item.nodeColor).toBe(color); expect(item.stateColor).toBe(color); expect(item.nodeHidden).toBe('true');
      }
      expect(timeline.active!.dotColor).toBe(tokens.info); expect(timeline.error!.glyphColor).toBe(tokens.error); expect(timeline.success!.glyphColor).toBe(tokens.success);
      expect(timeline.error!.glyphPath).toBeTruthy(); expect(timeline.success!.glyphPath).toBeTruthy(); expect(timeline.error!.glyphPath).not.toBe(timeline.success!.glyphPath);
      expect(comparison.stepsLabel).toBe('状态对照步骤'); expect(steps).toHaveLength(3);
      expect(steps.map(step => step.current)).toEqual([null, 'step', null]);
      expect(steps.map(step => step.state)).toEqual(['已完成', '当前步骤，进行中', '待开始']);
      expect(steps[0]!.sealColor).toBe(tokens.success); expect(steps[1]!.sealColor).toBe(tokens.info); expect(steps.every(step => step.sealHidden === 'true')).toBe(true);
      const normalInput = page.getByRole('textbox', { name: '正常聚焦输入', exact: true });
      await normalInput.focus(); await expect(normalInput).toBeFocused(); await expect(normalInput).not.toHaveAttribute('aria-invalid', 'true');
      await expect.poll(() => normalInput.evaluate(element => getComputedStyle(element).borderBottomColor)).toBe(tokens.focus);
      const errorInput = page.getByRole('textbox', { name: '异常聚焦输入', exact: true });
      await errorInput.focus(); await expect(errorInput).toBeFocused(); await expect(errorInput).toHaveAttribute('aria-invalid', 'true');
      await expect.poll(() => errorInput.evaluate(element => getComputedStyle(element).borderBottomColor)).toBe(tokens.error);
      expect(await errorInput.evaluate(element => element.getAttribute('aria-describedby')?.split(/\s+/).some(id => document.getElementById(id)?.textContent === '此项需要修正。'))).toBe(true);
    }
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
