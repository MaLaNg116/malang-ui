import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors = collectErrors(page); await use(errors);
    expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
  return errors;
}
type StoryEntry = { id: string; title: string; type: string; exportName?: string };
async function openStory(page: Page, exportedName: string, globals = 'theme:light;palette:paper;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = (await response.json() as { entries: Record<string, StoryEntry> }).entries;
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(entries).find(entry => entry.type === 'story' && entry.title === '基础组件/Toast 轻提示' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Toast/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
const placements = ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'];
async function checkPlacement(viewport: Locator, placement: string, rtl: boolean, width: number, height: number) {
  await expect.poll(() => viewport.evaluate((element, expected) => {
    const box = element.getBoundingClientRect(), [vertical, horizontal] = expected.placement.split('-');
    const verticalGap = vertical === 'top' ? box.top : expected.height - box.bottom;
    const leftAligned = horizontal === 'start' ? !expected.rtl : expected.rtl;
    const horizontalGap = horizontal === 'center' ? Math.abs((box.left + box.right) / 2 - expected.width / 2) : leftAligned ? box.left : expected.width - box.right;
    return Math.abs(verticalGap - 12) <= 1 && (horizontal === 'center' ? horizontalGap <= 1 : Math.abs(horizontalGap - 12) <= 1)
      && box.left >= 11 && box.right <= expected.width - 11 && box.top >= 11 && box.bottom <= expected.height - 11;
  }, { placement, rtl, width, height })).toBe(true);
}

test.describe('Toast placement', () => {
  test('moves the same notification through six LTR and RTL locations without repeating its live message or taking focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 }); await openStory(page, 'Positions');
    const viewport = page.getByRole('region', { name: '位置通知', exact: true });
    await expect(viewport.getByRole('group')).toHaveCount(0);
    const draft = page.getByRole('textbox', { name: '位置通知外的草稿', exact: true });
    await draft.fill('位置变化后继续编辑的中文草稿');
    const show = page.getByRole('button', { name: '显示位置通知', exact: true }); await show.click();
    const toast = viewport.getByRole('group', { name: '位置通知已就绪', exact: true });
    await expect(toast).toBeVisible(); await expect(show).toBeFocused();
    const live = viewport.getByRole('status'); await expect(live).toHaveText('位置通知已就绪 落点已经调整，手中的编辑内容会继续保留。');
    await expect(viewport.getByRole('alert')).toBeEmpty();
    expect(await toast.getAttribute('aria-live')).toBeNull();
    const original = await toast.elementHandle();
    const observer = await live.evaluateHandle(element => {
      const state = { changes: 0, observer: undefined as MutationObserver | undefined };
      state.observer = new MutationObserver(() => { state.changes++; });
      state.observer.observe(element, { childList: true, characterData: true, subtree: true });
      return state;
    });
    const select = page.getByRole('combobox', { name: '通知位置', exact: true });
    for (const rtl of [false, true]) {
      if (rtl) await page.getByRole('switch', { name: '从右向左阅读', exact: true }).check();
      for (const placement of placements) {
        await select.focus(); await select.selectOption(placement); await expect(select).toBeFocused();
        await checkPlacement(viewport, placement, rtl, 1280, 720);
        expect(await toast.evaluate((element, saved) => element === saved, original)).toBe(true);
        await expect(viewport.getByRole('status')).toHaveCount(1); await expect(viewport.getByRole('alert')).toHaveCount(1);
        await expect(live).toHaveText('位置通知已就绪 落点已经调整，手中的编辑内容会继续保留。');
      }
    }
    await draft.focus(); await select.selectOption('top-center'); await expect(draft).toBeFocused();
    await expect(draft).toHaveValue('位置变化后继续编辑的中文草稿');
    const close = toast.getByRole('button', { name: '关闭位置通知', exact: true });
    await close.focus(); await select.selectOption('bottom-center'); await expect(close).toBeFocused();
    // Fixed geometry must use the available content width, including pages that reserve a scrollbar gutter.
    await page.setViewportSize({ width: 360, height: 720 });
    await page.evaluate(() => { document.documentElement.style.scrollbarGutter = 'stable'; });
    // With overlay scrollbars Chromium's clientWidth can still include the reserved gutter.
    const availableWidth = await page.evaluate(() => document.documentElement.getBoundingClientRect().width);
    for (const placement of placements) {
      await select.selectOption(placement);
      await checkPlacement(viewport, placement, true, availableWidth, 720);
    }
    await expect(close).toBeFocused();
    expect(await observer.evaluate(state => state.changes)).toBe(0);
    await observer.evaluate(state => state.observer?.disconnect()); await observer.dispose();
    await close.press('Space'); await expect(toast).toHaveCount(0); await expect(live).toBeEmpty();
    await original?.dispose();
  });

  test('keeps a top-centred long notification readable, scrollable and closable on a short touch screen across the light materials and dark theme', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 480 }, hasTouch: true, baseURL: 'http://127.0.0.1:6007' });
    try {
      const page = await context.newPage(), errors = collectErrors(page);
      for (const profile of ['theme:light;palette:paper', 'theme:light;palette:celadon', 'theme:light;palette:gilt', 'theme:dark;palette:gilt']) {
        await page.setViewportSize({ width: 360, height: 480 }); await openStory(page, 'TopCenter', `${profile};motion:reduced`);
        const viewport = page.getByRole('region', { name: '顶部通知', exact: true });
        await expect(viewport.getByRole('group')).toHaveCount(0);
        const draft = page.getByRole('textbox', { name: '顶部通知外的草稿', exact: true }); await draft.fill('短屏通知仍保留这份草稿');
        await page.getByRole('switch', { name: '使用长通知内容', exact: true }).check();
        const show = page.getByRole('button', { name: '显示顶部居中通知', exact: true }); await show.click();
        const toast = viewport.getByRole('group'); await expect(toast).toHaveCount(1); await expect(show).toBeFocused();
        await page.setViewportSize({ width: 360, height: 240 }); await checkPlacement(viewport, 'top-center', false, 360, 240);
        const content = toast.locator('.ui-toast__content');
        expect(await content.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
        await content.hover(); await page.mouse.wheel(0, 500); await expect.poll(() => content.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
        const close = toast.getByRole('button', { name: '关闭顶部通知', exact: true }); await expect(close).toBeVisible();
        const box = await close.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
        await expect(draft).toHaveValue('短屏通知仍保留这份草稿');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        await close.click(); await expect(toast).toHaveCount(0); await expect(viewport.getByRole('status')).toBeEmpty();
      }
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });

  test('shows a compact single-message body, preserves editing focus and pauses its three-second lifetime on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 }); await openStory(page, 'TopCenter');
    const viewport = page.getByRole('region', { name: '顶部通知', exact: true });
    const draft = page.getByRole('textbox', { name: '顶部通知外的草稿', exact: true });
    const show = page.getByRole('button', { name: '显示顶部居中通知', exact: true });
    await expect(viewport.getByRole('group')).toHaveCount(0); await draft.fill('轻提示出现后仍保留的中文草稿');
    await show.click();
    const toast = viewport.getByRole('group', { name: '资料已更新，可以继续编辑。', exact: true });
    await expect(toast).toBeVisible(); await expect(show).toBeFocused();
    await expect(toast.getByRole('button')).toHaveCount(0);
    await expect(toast.locator('.ui-toast__title, .ui-toast__description')).toHaveCount(0);
    await expect(viewport.getByRole('status')).toHaveText('资料已更新，可以继续编辑。');
    await expect(viewport.getByRole('alert')).toBeEmpty();
    const box = await toast.boundingBox(), area = await viewport.boundingBox();
    expect(box!.height).toBeLessThanOrEqual(48); expect(box!.width).toBeLessThan(area!.width);
    expect(Math.abs(box!.x + box!.width / 2 - 640)).toBeLessThanOrEqual(1);
    await draft.focus(); await expect(draft).toBeFocused();
    await page.mouse.move(0, 480);
    await expect(toast).toHaveCount(0); await expect(viewport.getByRole('status')).toBeEmpty();
    await expect(draft).toBeFocused(); await expect(draft).toHaveValue('轻提示出现后仍保留的中文草稿');

    await show.click(); await expect(toast).toBeVisible(); await toast.hover();
    await page.waitForTimeout(3200); await expect(toast).toBeVisible();
    await page.mouse.move(0, 480); await expect(toast).toHaveCount(0);
    await expect(viewport.getByRole('status')).toBeEmpty();
  });
});
