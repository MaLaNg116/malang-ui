import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function open(page: Page, story = 'lifecycle') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBe(true);
  const { entries } = await response.json() as { entries: Record<string, { id: string; type: string; title: string }> };
  const entry = Object.values(entries).find(item => item.type === 'story' && item.title === '动效/DOM 变化过渡' && item.id.endsWith(`--${story}`));
  expect(entry).toBeDefined();
  await page.goto('/iframe.html?' + new URLSearchParams({ id: entry!.id, viewMode: 'story', globals: 'theme:light;palette:celadon;motion:standard' }));
  await page.locator('[data-motion-desk]').waitFor();
}

test('moves remaining keyed rows while a departing row is inert and excluded from native submission', async ({ page }) => {
  await open(page);
  const form = page.locator('[data-motion-primary] [data-motion-desk]');
  const departing = form.locator('[data-motion-row="1"]');
  const remaining = form.locator('[data-motion-row="2"]');
  const input = remaining.getByRole('textbox', { name: '青玉', exact: true });
  await input.fill('继续编辑这份卷宗');
  const row = await remaining.elementHandle();
  const remove = departing.getByRole('button', { name: '移除墨关', exact: true });
  await remove.focus();
  await remove.press('Enter');
  await expect(departing).toHaveAttribute('data-ui-transition-phase', 'leave');
  await expect(departing).toHaveAttribute('aria-hidden', 'true');
  expect(await departing.evaluate(element => ({
    inert: (element as HTMLElement).inert,
    absolute: getComputedStyle(element).position,
    disabled: (element.querySelector('input') as HTMLInputElement).disabled,
  }))).toEqual({ inert: true, absolute: 'absolute', disabled: true });
  await expect(form.getByRole('button', { name: '新增卷宗', exact: true })).toBeFocused();
  expect(await form.evaluate(element => new FormData(element as HTMLFormElement).getAll('archives'))).toEqual(['继续编辑这份卷宗', '经纬织光']);
  await expect.poll(() => remaining.evaluate(element => element.getAnimations().some(animation =>
    'transitionProperty' in animation && animation.transitionProperty === 'transform'
  ))).toBe(true);
  await expect(departing).toHaveCount(0);
  await form.getByRole('button', { name: '倒序排列', exact: true }).click();
  await expect(form.locator('[data-motion-row]').first()).toHaveAttribute('data-motion-row', '3');
  expect(await remaining.evaluate((element, previous) => element === previous, row)).toBe(true);
  await expect(input).toHaveValue('继续编辑这份卷宗');
  await row?.dispose();

  await form.getByRole('button', { name: '新增卷宗', exact: true }).click();
  const entering = form.locator('[data-motion-row="4"]');
  await entering.evaluate(element => {
    const animation = element.getAnimations().find(animation => animation.id === 'ui-transition-enter')!;
    animation.pause();
    animation.currentTime = 0;
  });
  const checkbox = entering.getByRole('checkbox', { name: '勾选新卷 4', exact: true });
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(entering).not.toHaveAttribute('data-ui-transition-phase');

  const list = form.getByRole('list', { name: '当前卷宗' });
  const oldPositions = await list.locator('li').evaluateAll(rows => rows.slice(0, 2).map(element => ({
    id: element.getAttribute('data-motion-row'),
    top: (element as HTMLElement).offsetTop,
  })));
  await form.getByRole('button', { name: '替换前两卷', exact: true }).click();
  await expect(list.locator('[data-motion-row="5"]')).toHaveAttribute('data-ui-transition-phase', 'enter');
  for (const { id, top } of oldPositions) {
    const row = list.locator(`[data-motion-row="${id}"]`);
    await expect(row).toHaveAttribute('data-ui-transition-phase', 'leave');
    expect(await row.evaluate(element => (element as HTMLElement).offsetTop)).toBe(top);
  }
  await expect(checkbox).toBeChecked();
});

test('folds actual height, reverses without stale accessibility state and settles on focus or unmount', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
  await page.setViewportSize({ width: 360, height: 720 });
  await open(page);
  const form = page.locator('[data-motion-primary] [data-motion-desk]');
  const panel = form.locator('[data-motion-panel]');
  const note = panel.getByRole('textbox', { name: '卷末备注', exact: true });
  const toggle = form.getByRole('button', { name: '切换卷末备注', exact: true });
  const initialHeight = (await panel.boundingBox())!.height;
  await note.fill('反向折叠后仍保留草稿');
  await toggle.evaluate(element => (element as HTMLButtonElement).click());
  await expect(toggle).toBeFocused();
  await expect(panel).toHaveAttribute('data-ui-transition-phase', 'leave');
  const during = await panel.evaluate(element => {
    const animation = element.getAnimations().find(animation => animation.id === 'ui-transition-leave')!;
    animation.pause();
    animation.currentTime = Number(animation.effect!.getTiming().duration) / 2;
    return { height: element.getBoundingClientRect().height, opacity: Number(getComputedStyle(element).opacity) };
  });
  expect(during.height).toBeGreaterThan(0);
  expect(during.height).toBeLessThan(initialHeight);
  expect(await form.evaluate(element => new FormData(element as HTMLFormElement).has('note'))).toBe(false);
  const reversed = await toggle.evaluate(async element => {
    (element as HTMLButtonElement).click();
    await Promise.resolve();
    const panel = document.getElementById(element.getAttribute('aria-controls')!)!;
    const animation = panel.getAnimations().find(animation => animation.id === 'ui-transition-enter')!;
    animation.pause();
    animation.currentTime = 0;
    return { height: panel.getBoundingClientRect().height, opacity: Number(getComputedStyle(panel).opacity) };
  });
  expect(reversed.height).toBeCloseTo(during.height, 1);
  expect(reversed.opacity).toBeCloseTo(during.opacity, 3);
  await expect(panel).toHaveAttribute('data-ui-transition-phase', 'enter');
  await expect(panel).not.toHaveAttribute('inert');
  await expect(panel).not.toHaveAttribute('aria-hidden');
  await expect(note).toHaveValue('反向折叠后仍保留草稿');
  await expect(panel.getByRole('textbox', { name: '封存字段', exact: true })).toBeDisabled();
  await note.focus();
  await expect(note).toBeFocused();
  await expect(panel).not.toHaveAttribute('data-ui-transition-phase');
  expect((await panel.boundingBox())!.height).toBe(initialHeight);
  expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('note'))).toBe('反向折叠后仍保留草稿');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);

  await form.getByRole('button', { name: '切换落印状态', exact: true }).click();
  const status = form.locator('[data-motion-status]');
  await expect(status).toHaveAttribute('data-ui-transition-preset', 'stamp');
  await expect(status).toHaveText('已落印 · 可以交付');
  await page.getByRole('button', { name: '打开并行工作台', exact: true }).click();
  const second = page.locator('[data-motion-secondary]');
  await second.getByRole('button', { name: '切换卷末备注', exact: true }).click();
  const separate = await second.locator('[data-motion-panel]').evaluateHandle(element => {
    const animation = element.getAnimations().find(animation => animation.id === 'ui-transition-leave')!;
    animation.pause();
    return animation;
  });
  await toggle.click();
  const animation = await panel.evaluateHandle(element => element.getAnimations().find(animation => animation.id === 'ui-transition-leave')!);
  await page.getByRole('button', { name: '卸载过渡工作台', exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(await animation.evaluate(active => active.playState)).toBe('idle');
  await animation.dispose();
  expect(await separate.evaluate(active => active.playState)).toBe('paused');
  await separate.dispose();
  expect(errors).toEqual([]);
});

test('reacts to local and system reduced-motion changes and an explicit disable without disturbing outside focus', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page);
  const form = page.locator('[data-motion-desk]');
  const add = form.getByRole('button', { name: '新增卷宗', exact: true });
  const local = form.getByRole('switch', { name: '减少容器动态效果', exact: true });
  const disabled = form.getByRole('switch', { name: '停用工作台过渡', exact: true });
  await add.click();
  const added = form.locator('[data-motion-row="4"]');
  await expect(added).toHaveAttribute('data-ui-transition-phase', 'enter');
  await local.check();
  await expect(added).not.toHaveAttribute('data-ui-transition-phase');
  expect(await added.evaluate(element => element.getAnimations().length)).toBe(0);
  await expect(local).toBeFocused();
  await local.uncheck();

  await added.getByRole('button', { name: '移除新卷 4', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(added).toHaveAttribute('data-ui-transition-phase', 'leave');
  await expect(local).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(added).toHaveCount(0);
  await expect(local).toBeFocused();
  await add.click();
  const reducedRow = form.locator('[data-motion-row="5"]');
  await expect(reducedRow).toBeVisible();
  await expect(reducedRow).not.toHaveAttribute('data-ui-transition-phase');
  await form.getByRole('button', { name: '切换落印状态', exact: true }).click();
  const status = form.locator('[data-motion-status]');
  await expect(status).toHaveText('已落印 · 可以交付');
  await expect(status).not.toHaveAttribute('data-ui-transition-phase');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const list = form.getByRole('list', { name: '当前卷宗' });
  await form.getByRole('button', { name: '倒序排列', exact: true }).click();
  const moving = list.locator('[data-motion-row="5"]');
  const move = await moving.evaluateHandle(element => {
    const animation = element.getAnimations().find(animation => 'transitionProperty' in animation && animation.transitionProperty === 'transform')!;
    animation.pause();
    animation.currentTime = 30;
    return animation;
  });
  expect(await moving.evaluate(element => getComputedStyle(element).transform)).not.toBe('none');
  await disabled.check();
  await expect.poll(() => moving.evaluate(element => getComputedStyle(element).transform)).toBe('none');
  await move.dispose();
  await form.getByRole('button', { name: '倒序排列', exact: true }).click();
  await expect(form.locator('[data-motion-row]').first()).toHaveAttribute('data-motion-row', '1');
  expect(await list.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(errors).toEqual([]);
});
