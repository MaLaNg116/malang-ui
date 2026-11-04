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
async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:standard') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === title && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function expectNoPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}
const accordionTitle = '二级组件/Accordion 折叠面板';
const stepsTitle = '二级组件/Steps 步骤条';

test.describe('Accordion', () => {
  test('links panels to named headings, skips disabled triggers and preserves an edited form while hidden', async ({ page }) => {
    await openStory(page, accordionTitle);
    const group = page.getByRole('group', { name: '工作台使用说明', exact: true });
    const archive = group.getByRole('button', { name: '配置档案', exact: true });
    const workflow = group.getByRole('button', { name: '编辑说明', exact: true });
    const motion = group.getByRole('button', { name: '动效偏好', exact: true });
    const panelId = await archive.getAttribute('aria-controls');
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toHaveAttribute('role', 'region');
    await expect(panel).toHaveAccessibleName('配置档案');
    const labelId = (await archive.getAttribute('aria-labelledby'))!;
    await expect(panel).toHaveAttribute('aria-labelledby', labelId);
    await expect(page.locator(`[id="${labelId}"]`)).toHaveText('配置档案');
    await expect(archive).toHaveAccessibleDescription('先确认名称，再开始整理内容。');
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
    const input = page.getByLabel('档案名称', { exact: true });
    await input.fill('山川 · 未提交的中文档案');
    await archive.focus();
    await page.keyboard.press('ArrowDown');
    await expect(workflow).toBeFocused();
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(workflow).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeHidden();
    await expect(input).toHaveValue('山川 · 未提交的中文档案');
    await expect(input).toBeHidden();
    await expect(group.getByRole('button', { name: '已归档条目', exact: true })).toBeDisabled();
    await page.keyboard.press('ArrowDown');
    await expect(motion).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(group.getByRole('switch', { name: '减少动态效果', exact: true })).toBeVisible();
    await page.keyboard.press('Home');
    await expect(archive).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('山川 · 未提交的中文档案');
    await page.keyboard.press('End');
    await expect(motion).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(archive).toBeFocused();
  });

  test('leaves declined controlled requests retryable and normalizes only the displayed single or multiple panels', async ({ page }) => {
    await openStory(page, accordionTitle, 'Controlled');
    const archive = page.getByRole('button', { name: '配置档案', exact: true });
    await archive.click();
    await expect(page.getByRole('status')).toHaveText('请求：1 次；父模型：archive');
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
    await archive.click();
    await expect(page.getByRole('status')).toHaveText('请求：2 次；父模型：archive');
    await page.getByRole('button', { name: '接受最近请求', exact: true }).click();
    await expect(archive).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('status')).toHaveText('请求：2 次；父模型：无');

    await openStory(page, accordionTitle, 'Multiple');
    const group = page.getByRole('group', { name: '工作台使用说明', exact: true });
    await expect(group.getByRole('region')).toHaveCount(2);
    await group.getByRole('button', { name: '编辑说明', exact: true }).click();
    await expect(group.getByRole('region')).toHaveCount(3);
    await group.getByRole('button', { name: '配置档案', exact: true }).click();
    await expect(group.getByRole('region')).toHaveCount(2);
    await expect(group.getByRole('button', { name: '动效偏好', exact: true })).toHaveAttribute('aria-expanded', 'true');

    await openStory(page, accordionTitle, 'InvalidValues');
    await expect(group.getByRole('region')).toHaveCount(1);
    await expect(group.getByRole('button', { name: '配置档案', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(group.getByRole('button', { name: '动效偏好', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('status')).toHaveText('展开项：missing, locked, archive, motion');
  });
});

test.describe('Steps', () => {
  test('presents an ordered quiet progress list with a named current, error and completed step', async ({ page }) => {
    await openStory(page, stepsTitle);
    const group = page.getByRole('group', { name: '档案编排进度', exact: true });
    await expect(group.getByRole('list')).toHaveCount(1);
    await expect(group.getByRole('listitem')).toHaveCount(4);
    await expect(group.getByRole('button')).toHaveCount(0);
    await expect(group.getByRole('status')).toHaveCount(0);
    await expect(group.locator('[aria-current="step"]')).toContainText('编排');
    await expect(group.locator('[aria-current="step"]')).toContainText('当前步骤，进行中');
    await expect(group.getByText('已完成', { exact: true })).toHaveCount(1);
    await openStory(page, stepsTitle, 'Error');
    await expect(group.locator('[aria-current="step"]')).toContainText('复核');
    await expect(group.locator('[aria-current="step"]')).toContainText('当前步骤，出现错误');
    await openStory(page, stepsTitle, 'Success');
    await expect(group.locator('[aria-current="step"]')).toContainText('落印');
    await expect(group.locator('[aria-current="step"]')).toContainText('当前步骤，已完成');
    await expect(group.getByText('待开始', { exact: true })).toHaveCount(0);
  });

  test('uses native interactive buttons, skips disabled steps in Tab order and lets the owner confirm repeated requests', async ({ page }) => {
    await openStory(page, stepsTitle, 'Interactive');
    const group = page.getByRole('group', { name: '档案编排进度', exact: true });
    const archive = group.getByRole('button', { name: '建档', exact: true });
    const motion = group.getByRole('button', { name: '编排', exact: true });
    const publish = group.getByRole('button', { name: '落印', exact: true });
    await expect(group.getByRole('button', { name: '复核', exact: true })).toBeDisabled();
    await archive.focus(); await page.keyboard.press('Space');
    await expect(archive).toHaveAttribute('aria-current', 'step');
    await expect(page.getByRole('status')).toHaveText('父模型步骤：archive');
    await page.keyboard.press('Tab'); await expect(motion).toBeFocused();
    await page.keyboard.press('Tab'); await expect(publish).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(publish).toHaveAttribute('aria-current', 'step');
    await expect(publish).toHaveAccessibleDescription('当前步骤，进行中 确认后保存本次成果。');

    await openStory(page, stepsTitle, 'Controlled');
    const requested = page.getByRole('button', { name: '编排', exact: true });
    await requested.click(); await requested.click();
    await expect(page.getByRole('status')).toHaveText('请求：2 次；父模型：archive');
    await expect(requested).not.toHaveAttribute('aria-current');
    await page.getByRole('button', { name: '接受最近步骤', exact: true }).click();
    await expect(requested).toHaveAttribute('aria-current', 'step');
    await openStory(page, stepsTitle, 'InvalidValue');
    await expect(group.locator('[aria-current="step"]')).toContainText('建档');
    await expect(page.getByRole('status')).toHaveText('父模型步骤：missing');
  });
});

test('keeps long fold labels and vertical mobile steps within 360px and respects both motion settings', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const source of ['container', 'system']) {
    await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
    const globals = `theme:dark;density:compact;motion:${source === 'container' ? 'reduced' : 'standard'}`;
    await openStory(page, accordionTitle, 'LongLabels', globals);
    await expectNoPageOverflow(page);
    const panel = page.locator('.ui-accordion__panel:not([hidden])');
    expect(await panel.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    await openStory(page, stepsTitle, 'Default', globals);
    await expectNoPageOverflow(page);
    const group = page.getByRole('group', { name: '档案编排进度', exact: true });
    const positions = await group.getByRole('listitem').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
    expect(positions[1]!.top).toBeGreaterThan(positions[0]!.bottom);
    expect(positions[1]!.left).toBe(positions[0]!.left);
    expect(await group.locator('[aria-current="step"] .ui-steps__seal').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  }
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await page.locator('[aria-current="step"] .ui-steps__seal').evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
});
