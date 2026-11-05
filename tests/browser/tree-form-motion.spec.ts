import { test as base, expect, type Page } from '@playwright/test';

const test = base.extend<{ errors: string[] }>({ errors: [async ({ page }, use) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
  await use(errors); expect(errors).toEqual([]);
}, { auto: true }] });

async function open(page: Page, title: string) {
  const index = await (await page.request.get('/index.json')).json();
  const story = (Object.values(index.entries) as { title: string; id: string; type: string }[]).find(entry => entry.type === 'story' && entry.title === title && entry.id.endsWith('--default'));
  expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=theme:dark;motion:standard`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

async function pauseAfterClick(page: Page, label: string) {
  return page.evaluate(async name => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(node => (node.getAttribute('aria-label') ?? node.textContent?.trim()) === name);
    if (!button) throw Error(`Missing operation: ${name}`);
    button.click(); await Promise.resolve();
    const animations = document.getAnimations().filter(animation => animation.id.startsWith('ui-transition-'));
    for (const animation of animations) { animation.pause(); animation.currentTime = 0; }
    return animations.map(animation => ({ id: animation.id, frames: (animation.effect as KeyframeEffect).getKeyframes().length }));
  }, label);
}

async function finish(page: Page) {
  await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('ui-transition-')).forEach(animation => animation.finish()));
}

test('tree expansion uses real short transitions and reversing a collapse restores interactive nodes', async ({ page }) => {
  await open(page, '表单组件/输入日期/TreeSelect 树选择');
  await page.getByRole('button', { name: '归档目录', exact: true }).click();
  const animations = await pauseAfterClick(page, '展开纸本');
  expect(animations.filter(animation => animation.id === 'ui-transition-enter').length).toBe(2);
  expect(animations.every(animation => animation.frames >= 2)).toBe(true);
  const leaf = page.getByRole('button', { name: '墨迹', exact: true });
  await leaf.focus(); await expect(leaf).toBeFocused();
  await expect(leaf.locator('..')).not.toHaveAttribute('data-ui-transition-phase', 'enter');
  await finish(page);
  const rowPositions = () => page.locator('.ui-tree-select__node').evaluateAll(nodes => nodes
    .filter(node => /墨迹|刻印/.test(node.textContent ?? ''))
    .map(node => node.getBoundingClientRect().top - node.parentElement!.getBoundingClientRect().top));
  const beforeCollapse = await rowPositions();
  const departing = await pauseAfterClick(page, '折叠纸本');
  expect(departing.filter(animation => animation.id === 'ui-transition-leave').length).toBe(2);
  await expect(page.locator('.ui-tree-select__node[data-ui-transition-phase="leave"][inert]')).toHaveCount(2);
  const duringCollapse = await rowPositions();
  expect(duringCollapse).toHaveLength(2);
  duringCollapse.forEach((top, index) => expect(Math.abs(top - beforeCollapse[index]!)).toBeLessThan(1));
  await expect(leaf).toHaveCount(0);
  await pauseAfterClick(page, '展开纸本'); await finish(page);
  await expect(leaf).toBeEnabled();
  await expect(page.getByRole('button', { name: '刻印', exact: true })).toBeDisabled();
  await expect(page.locator('.ui-tree-select__node[inert]')).toHaveCount(0);
  await leaf.click(); await expect(page.locator('[data-reference-model]')).toHaveText('"ink"');
});

test('tree operations settle immediately when local or system reduced motion changes', async ({ page }) => {
  await open(page, '表单组件/输入日期/TreeSelect 树选择');
  await page.getByRole('button', { name: '归档目录', exact: true }).click();
  expect((await pauseAfterClick(page, '展开纸本')).length).toBeGreaterThan(0);
  await page.locator('.kit-story-surface').evaluate(element => element.setAttribute('data-ui-motion', 'reduced'));
  await expect(page.locator('.ui-tree-select__node[data-ui-transition-phase]')).toHaveCount(0);
  await page.getByRole('button', { name: '折叠纸本', exact: true }).click();
  await expect(page.getByRole('button', { name: '墨迹', exact: true })).toHaveCount(0);
  await page.locator('.kit-story-surface').evaluate(element => element.setAttribute('data-ui-motion', 'standard'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await pauseAfterClick(page, '展开纸本')).toEqual([]);
  await expect(page.getByRole('button', { name: '墨迹', exact: true })).toBeEnabled();
});

test('animated dynamic rows leave native FormData immediately and preserve surviving drafts through reordering', async ({ page }) => {
  await open(page, '基础组件/Form 动态字段');
  await page.getByRole('textbox', { name: '档案名', exact: true }).fill('编码档案');
  await page.getByRole('textbox', { name: '成员1', exact: true }).fill('观山');
  await pauseAfterClick(page, '添加成员');
  const second = page.getByRole('textbox', { name: '成员2', exact: true });
  await second.fill('听雨'); await finish(page);
  await page.getByRole('button', { name: '上移成员2', exact: true }).focus();
  await page.getByRole('button', { name: '上移成员2', exact: true }).press('Enter');
  await expect(page.getByRole('textbox', { name: '成员1', exact: true })).toHaveValue('听雨');
  await expect(page.getByRole('button', { name: '上移成员1', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: '上移成员1', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '删除成员2', exact: true }).focus();
  expect((await pauseAfterClick(page, '删除成员2')).some(animation => animation.id === 'ui-transition-leave')).toBe(true);
  await expect(page.locator('.ui-form-list [data-ui-transition-phase="leave"][inert]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '添加成员', exact: true })).toBeFocused();
  const data = await page.getByRole('form', { name: '档案成员', exact: true }).evaluate(element => [...new FormData(element as HTMLFormElement)]);
  expect(data).toContainEqual(['members.0.name', '听雨']);
  expect(data.some(([name, value]) => name === 'members.1.name' || value === '观山')).toBe(false);
  await finish(page); await expect(page.locator('.ui-form-list [inert]')).toHaveCount(0);
  await page.getByRole('button', { name: '提交动态表单', exact: true }).click();
  await expect(page.locator('output')).toContainText('听雨');
  await expect(page.locator('output')).not.toContainText('观山');
});
