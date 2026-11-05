import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const tagStory = '表单组件/输入日期/InputTag 标签输入';
const transferStory = '表单组件/输入日期/Transfer 穿梭选择';
const tagItems = '.ui-input-tag__items';
const transferItems = '.ui-ri-transfer';

async function open(page: Page, title: string, motion = 'standard') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string }[];
  const entry = entries.find(item => item.type === 'story' && item.title === title && item.id.endsWith('--operation-motion'));
  expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=theme:dark;motion:${motion}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

async function clickAndObserve(button: Locator, selector: string, pause = false) {
  return button.evaluate(async (control, options) => {
    const group = document.querySelector(options.selector)!;
    (control as HTMLButtonElement).click();
    await Promise.resolve();
    const result = { enter: 0, leave: 0, move: 0 };
    for (const animation of group.getAnimations({ subtree: true })) {
      if (animation.id === 'ui-transition-enter') result.enter++;
      else if (animation.id === 'ui-transition-leave') result.leave++;
      else if (animation instanceof CSSTransition && animation.transitionProperty === 'transform') result.move++;
      else continue;
      if (options.pause) animation.pause();
    }
    return result;
  }, { selector, pause });
}

async function finishMotion(page: Page, selector: string) {
  await page.locator(selector).evaluate(element => {
    for (const animation of element.getAnimations({ subtree: true })) {
      if (animation.id.startsWith('ui-transition-') || animation instanceof CSSTransition && animation.transitionProperty === 'transform') {
        animation.finish();
      }
    }
  });
}

function submittedValues(page: Page, name: string) {
  return page.locator('form').evaluate((form, field) => new FormData(form as HTMLFormElement).getAll(field), name);
}

test('tag operations animate stable occurrences and keep controlled focus and form values correct during leave', async ({ page }) => {
  await open(page, tagStory);
  const input = page.getByRole('textbox', { name: '档案关键词', exact: true });
  const outside = page.getByRole('textbox', { name: '标签外草稿', exact: true });
  const copies = page.getByRole('button', { name: '移除标签墨迹', exact: true });
  const removed = await copies.first().elementHandle();
  const retained = await copies.last().elementHandle();
  const state = page.locator('[data-tag-motion-state]');
  await page.getByRole('button', { name: '拒绝标签更新', exact: true }).click();
  await copies.first().focus();
  await copies.first().press('Enter');
  await expect(copies.first()).toBeFocused();
  await expect(state).toHaveText('["墨迹","刻印","墨迹","青玉"]');
  await expect(page.locator('[data-tag-motion-requests]')).toHaveText('请求 1');

  await page.getByRole('button', { name: '接受标签更新', exact: true }).click();
  await copies.first().focus();
  expect((await clickAndObserve(copies.first(), tagItems, true)).leave).toBe(1);
  await expect(input).toBeFocused();
  await expect(copies).toHaveCount(1);
  expect(await removed!.evaluate(node => ({ connected: node.isConnected, inert: Boolean(node.closest('[inert]')), disabled: (node as HTMLButtonElement).disabled }))).toEqual({ connected: true, inert: true, disabled: true });
  expect(await retained!.evaluate(node => node.isConnected && !node.closest('[inert]'))).toBe(true);
  expect(await submittedValues(page, 'keyword')).toEqual(['刻印', '墨迹', '青玉']);
  await finishMotion(page, tagItems);
  await expect.poll(() => removed!.evaluate(node => node.isConnected)).toBe(false);

  const reorder = page.getByRole('button', { name: '反转标签顺序', exact: true });
  const reordered = await clickAndObserve(reorder, tagItems, true);
  expect(reordered.move).toBeGreaterThan(0);
  expect(reordered.enter).toBe(0);
  expect(reordered.leave).toBe(0);
  expect(await submittedValues(page, 'keyword')).toEqual(['青玉', '墨迹', '刻印']);
  await finishMotion(page, tagItems);
  await input.fill('纸纹');
  expect((await clickAndObserve(page.getByRole('button', { name: '添加', exact: true }), tagItems, true)).enter).toBe(1);
  await expect(state).toHaveText('["青玉","墨迹","刻印","纸纹"]');
  await finishMotion(page, tagItems);

  await outside.focus();
  const closeSeal = page.getByRole('button', { name: '移除标签刻印', exact: true });
  const leavingSeal = await closeSeal.elementHandle();
  expect((await clickAndObserve(closeSeal, tagItems, true)).leave).toBe(1);
  await expect(outside).toBeFocused();
  await page.getByRole('button', { name: '切换标签实例', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(page.locator(tagItems)).toHaveCount(0);
  expect(await leavingSeal!.evaluate(node => !node.isConnected && node.getAnimations().length === 0)).toBe(true);
  await expect(outside).toBeFocused();
});

test('transfer moves and reverses rows while the departing copy is inert and the form follows the owner', async ({ page }) => {
  await open(page, transferStory);
  const source = page.getByRole('region', { name: '待选项目', exact: true });
  const target = page.getByRole('region', { name: '已选项目', exact: true });
  const sourceSeal = source.getByRole('checkbox', { name: '刻印', exact: true });
  const oldSeal = await sourceSeal.elementHandle();
  await sourceSeal.check();
  const moveRight = source.getByRole('button', { name: '移入已选', exact: true });
  await moveRight.focus();
  const moved = await clickAndObserve(moveRight, transferItems, true);
  expect(moved.enter).toBe(1);
  expect(moved.leave).toBe(1);
  await expect(moveRight).toBeFocused();
  await expect(moveRight).toBeDisabled();
  expect(await oldSeal!.evaluate(node => node.isConnected && Boolean(node.closest('[inert]')) && (node as HTMLInputElement).disabled)).toBe(true);
  expect(await submittedValues(page, 'archive')).toEqual(['ink', 'seal']);

  await target.getByRole('checkbox', { name: '刻印', exact: true }).check();
  const moveLeft = target.getByRole('button', { name: '移回待选', exact: true });
  await moveLeft.focus();
  await clickAndObserve(moveLeft, transferItems);
  await expect(moveLeft).toBeFocused();
  await expect(sourceSeal).toHaveCount(1);
  await expect(page.locator('input[type=checkbox][value=seal]')).toHaveCount(1);
  expect(await submittedValues(page, 'archive')).toEqual(['ink']);

  const search = source.getByRole('textbox', { name: '搜索待选项目', exact: true });
  const bulkAnimations = await search.evaluate(async input => {
    (input as HTMLInputElement).value = '刻印';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await Promise.resolve();
    return input.closest('section')!.getAnimations({ subtree: true }).filter(animation => animation.id.startsWith('ui-transition-')).length;
  });
  expect(bulkAnimations).toBe(0);
  await expect(sourceSeal).toBeVisible();
  await search.fill('没有对应的项目');
  await expect(source.getByText('暂无数据', { exact: true })).toBeVisible();
  await expect(search).toBeFocused();
  await page.getByRole('button', { name: '提交归档项目', exact: true }).click();
  await expect(page.locator('[data-transfer-motion-form]')).toHaveText('["ink"]');
});

test('system and container reduction settle both operations instantly at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 700 });
  for (const source of ['system', 'container'] as const) {
    await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
    const motion = source === 'container' ? 'reduced' : 'standard';
    await open(page, tagStory, motion);
    const first = page.getByRole('button', { name: '移除标签墨迹', exact: true }).first();
    await first.focus();
    expect(await clickAndObserve(first, tagItems)).toEqual({ enter: 0, leave: 0, move: 0 });
    await expect(page.getByRole('textbox', { name: '档案关键词', exact: true })).toBeFocused();
    expect(await submittedValues(page, 'keyword')).toEqual(['刻印', '墨迹', '青玉']);

    await open(page, transferStory, motion);
    await page.getByRole('checkbox', { name: '刻印', exact: true }).check();
    const move = page.getByRole('button', { name: '移入已选', exact: true });
    await move.focus();
    expect(await clickAndObserve(move, transferItems)).toEqual({ enter: 0, leave: 0, move: 0 });
    await expect(move).toBeFocused();
    expect(await submittedValues(page, 'archive')).toEqual(['ink', 'seal']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  }
});
