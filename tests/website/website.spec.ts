import { expect, test as base } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync(new URL('../../website/src/data/components.json', import.meta.url), 'utf8')) as { name: string; label: string }[];

const test = base.extend<{ browserErrors: void }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text());
    });
    await use();
    expect(errors).toEqual([]);
  }, { auto: true }],
});

test('finds every component in the grouped navigation and preserves search across pages', async ({ page }) => {
  await page.goto('/#/components');
  const navigation = page.getByRole('navigation', { name: '组件导航', exact: true });
  await expect(navigation.locator('a')).toHaveCount(100);
  const search = page.getByRole('searchbox', { name: '搜索组件', exact: true });
  await search.fill('m-input');
  await expect(navigation.locator('a[href="#/components/MInput"]')).toBeVisible();
  await expect(navigation.locator('a[href="#/components/MMenu"]')).toHaveCount(0);
  await search.fill('菜单');
  await navigation.locator('a[href="#/components/MMenu"]').click();
  await expect(page.getByRole('heading', { name: '导航菜单', level: 1 })).toBeVisible();
  await expect(search).toHaveValue('菜单');
  await expect(navigation.locator('[aria-current="page"]')).toHaveAttribute('href', '#/components/MMenu');
  await search.fill('不存在的组件xyz');
  await expect(navigation.getByText('没有匹配的组件。')).toBeVisible();
  await search.fill('');
  await expect(navigation.locator('a')).toHaveCount(100);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.setViewportSize({ width: 1440, height: 520 });
  await expect.poll(() => navigation.evaluate(element => {
    const active = element.querySelector('[aria-current="page"]')!.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    return active.top >= bounds.top && active.bottom <= bounds.bottom;
  })).toBe(true);
});

for (const item of catalog) {
  test(`renders native ${item.name} documentation with a working source example`, async ({ page }) => {
    await page.goto(`/#/components/${item.name}`);
    await expect(page.getByRole('heading', { name: item.label, level: 1, exact: true })).toBeVisible();
    const demo = page.locator('[data-demo-id]').first();
    await expect(demo).toHaveAttribute('data-demo-state', 'ready');
    await expect(page.locator('main iframe')).toHaveCount(0);
    await expect(demo.locator('.doc-demo__stage')).not.toBeEmpty();
    await demo.getByText('查看代码', { exact: true }).click();
    const code = await demo.locator('pre code').textContent();
    expect(code).toContain(item.name);
    expect(code).toMatch(/from ['"]malang-ui['"]/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}

test('uses native Menu selection, controlled groups, keyboard semantics and readable item types', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#/components/MMenu');
  const basic = page.locator('[data-demo-id="MMenu-basic"]');
  await expect(basic).toHaveAttribute('data-demo-state', 'ready');
  await basic.getByRole('button', { name: '我的项目', exact: true }).click();
  await expect(basic.getByText('当前选中：projects', { exact: true })).toBeVisible();
  const group = basic.getByRole('button', { name: '创作空间', exact: true });
  await group.focus();
  await group.press('Escape');
  await expect(group).toHaveAttribute('aria-expanded', 'false');
  await group.press('Enter');
  await expect(group).toHaveAttribute('aria-expanded', 'true');
  await basic.getByRole('button', { name: '重置示例', exact: true }).click();
  await expect(basic.getByText('当前选中：overview', { exact: true })).toBeVisible();
  await basic.getByText('查看代码', { exact: true }).click();
  const code = await basic.locator('pre code').textContent();
  expect(code).toContain('v-model:expanded-values');
  await basic.getByRole('button', { name: /^复制 .* 代码$/ }).click();
  await expect.poll(async () => (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n?/g, '\n')).toBe(code);
  const controlled = page.locator('[data-demo-id="MMenu-controlled"]');
  await controlled.getByRole('button', { name: '全部展开', exact: true }).click();
  await expect(controlled.getByRole('button', { name: '作品管理' })).toHaveAttribute('aria-expanded', 'true');
  await expect(controlled.getByRole('button', { name: '协作空间' })).toHaveAttribute('aria-expanded', 'true');
  await controlled.getByRole('switch', { name: '只展开一个分组' }).check();
  await expect(controlled.getByRole('button', { name: '作品管理' })).toHaveAttribute('aria-expanded', 'false');
  const disabled = page.locator('[data-demo-id="MMenu-disabled"]');
  await expect(disabled.getByRole('button', { name: '私密素材（无权限）' })).toBeDisabled();
  await disabled.getByRole('switch', { name: '禁用整组菜单' }).check();
  await expect(disabled.getByRole('button', { name: '素材管理' })).toBeDisabled();
  await page.getByRole('navigation', { name: '本页目录' }).getByRole('button', { name: 'API 参考', exact: true }).click();
  const props = page.getByRole('region', { name: 'Props 表格', exact: true });
  await expect(props.getByRole('row', { name: /expandedValues/ })).toContainText('展开');
  await expect(page.getByText('MMenuItem', { exact: true }).first()).toBeVisible();
});

test('keeps native Input drafts and Button loading local to each example and supports reset', async ({ page }) => {
  await page.goto('/#/components/MInput');
  const demo = page.locator('[data-demo-id="MInput-basic"]');
  await demo.getByRole('textbox', { name: '项目名称', exact: true }).fill('纸上山河');
  await expect(demo.getByText('当前值：纸上山河', { exact: true })).toBeVisible();
  await demo.getByRole('button', { name: '重置示例' }).click();
  await expect(demo.getByRole('textbox', { name: '项目名称' })).toHaveValue('山海之间');
  await page.getByRole('navigation', { name: '组件导航' }).locator('a[href="#/components/MButton"]').click();
  const sizes = page.locator('[data-demo-id="MButton-sizes"]');
  const button = sizes.getByRole('button', { name: '创建项目', exact: true });
  const medium = await button.boundingBox();
  await sizes.getByRole('radio', { name: '大尺寸', exact: true }).check();
  await expect.poll(async () => (await button.boundingBox())!.height).toBeGreaterThan(medium!.height);
  const loading = page.locator('[data-demo-id="MButton-loading"]');
  await loading.getByRole('button', { name: '模拟保存', exact: true }).click();
  await expect(loading.getByRole('button', { name: '正在保存…', exact: true })).toBeDisabled();
  await expect(loading.getByText('模拟保存完成', { exact: true })).toBeVisible();
  await expect(loading.getByRole('button', { name: '模拟保存', exact: true })).toBeEnabled();
});

test('opens component navigation on a small screen and keeps source and API scrolling within the document', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/#/components/MMenu');
  const navigation = page.getByRole('navigation', { name: '组件导航', exact: true });
  await expect(navigation).toBeHidden();
  await page.getByRole('button', { name: '打开组件导航', exact: true }).click();
  await expect(navigation).toBeVisible();
  await page.getByRole('searchbox', { name: '搜索组件', exact: true }).fill('Input');
  await navigation.locator('a[href="#/components/MInput"]').click();
  await expect(navigation).toBeHidden();
  await expect(page.getByRole('heading', { name: '输入框', level: 1 })).toBeVisible();
  const toc = page.getByRole('navigation', { name: '本页目录' });
  await toc.getByRole('button', { name: 'API 参考', exact: true }).click();
  await expect(page.locator('#catalog-api')).toBeFocused();
  const table = page.getByRole('region', { name: 'Props 表格', exact: true });
  expect(await table.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await table.focus(); await table.press('ArrowRight');
  await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});


test('applies and remembers the selected theme, paper and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/');
  const browse = page.getByRole('link', { name: /^浏览组件/ });
  await expect(browse).toBeVisible();
  await page.evaluate(() => localStorage.setItem('malang-website-settings-v1', 'null'));
  await page.reload();
  await expect(browse).toBeVisible();
  await browse.click();
  const main = page.locator('main[data-site-page="components"]');
  const provider = page.locator('html');
  const color = () => main.evaluate(element => getComputedStyle(element).getPropertyValue('--ui-color-canvas').trim());
  await expect(provider).toHaveAttribute('data-ui-theme', 'dark');
  await expect(provider).toHaveAttribute('data-ui-palette', 'paper');
  const darkColor = await color();
  expect(darkColor).not.toBe('');

  const appearance = page.getByRole('button', { name: '外观设置', exact: true });
  await appearance.click();
  const paper = page.getByRole('group', { name: '纸面材质', exact: true });
  const theme = page.getByRole('group', { name: '明暗模式', exact: true });
  await theme.getByRole('radio', { name: '浅色', exact: true }).click();
  await expect(provider).toHaveAttribute('data-ui-theme', 'light');
  const paperColor = await color();
  expect(paperColor).not.toBe(darkColor);
  await paper.getByRole('radio', { name: '青瓷', exact: true }).click();
  await expect(provider).toHaveAttribute('data-ui-palette', 'celadon');
  const celadonColor = await color();
  expect(celadonColor).not.toBe(paperColor);
  await theme.getByRole('radio', { name: '深色', exact: true }).click();
  await expect(provider).toHaveAttribute('data-ui-theme', 'dark');
  expect(await color()).toBe(darkColor);
  await page.getByRole('switch', { name: '减少动态效果', exact: true }).check();
  await expect(provider).toHaveAttribute('data-ui-motion', 'reduced');

  await page.reload();
  await expect(provider).toHaveAttribute('data-ui-theme', 'dark');
  await expect(provider).toHaveAttribute('data-ui-palette', 'celadon');
  await expect(provider).toHaveAttribute('data-ui-motion', 'reduced');
  expect(await color()).toBe(darkColor);
  await appearance.click();
  await theme.getByRole('radio', { name: '浅色', exact: true }).click();
  await expect(provider).toHaveAttribute('data-ui-theme', 'light');
  expect(await color()).toBe(celadonColor);
});

test('opens component search by keyboard and selects a result without a pointer', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/#/');
  const trigger = page.getByRole('button', { name: '搜索组件', exact: true });
  const dialog = page.getByRole('dialog', { name: '搜索组件', exact: true });
  const search = dialog.getByRole('combobox', { name: '查找组件', exact: true });
  await trigger.focus();
  await page.keyboard.press('ControlOrMeta+k');
  await expect(dialog).toBeVisible();
  await expect(search).toBeFocused();
  await search.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.keyboard.press('ControlOrMeta+k');
  await expect(search).toBeFocused();
  const options = dialog.getByRole('listbox', { name: '组件搜索结果', exact: true }).getByRole('option');
  await expect(options).toHaveCount(10);
  for (let index = 1; index < 10; index += 1) await search.press('ArrowDown');
  await expect(options.last()).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => options.last().evaluate(option => {
    const list = option.closest('[role="listbox"]')!;
    const view = list.getBoundingClientRect();
    const row = option.getBoundingClientRect();
    return list.scrollTop > 0 && row.top >= view.top - 1 && row.bottom <= view.bottom + 1;
  })).toBe(true);
  await search.fill('MInput');
  const selected = dialog.getByRole('option', { selected: true });
  await expect(selected.getByText('MInput', { exact: true })).toBeVisible();
  await search.press('ArrowDown');
  await expect(selected.getByText('MInputNumber', { exact: true })).toBeVisible();
  await search.press('Enter');
  await expect(page).toHaveURL(/#\/components\/MInputNumber$/);
  await expect(dialog).toBeHidden();
});

test('offers selected manual source when the browser clipboard is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Clipboard unavailable', 'NotAllowedError')) },
    });
  });
  await page.goto('/#/guide');
  const block = page.getByRole('region', { name: 'FirstCanvas.vue', exact: true });
  const code = await block.locator('pre code').textContent() ?? '';
  await block.getByRole('button', { name: '复制 FirstCanvas.vue 代码', exact: true }).click();
  const manual = block.getByRole('textbox', { name: '可手动复制的代码', exact: true });
  await expect(manual).toBeFocused();
  await expect(manual).toHaveValue(code);
  expect(await manual.evaluate(element => {
    const field = element as HTMLTextAreaElement;
    return [field.selectionStart, field.selectionEnd];
  })).toEqual([0, code.length]);
});

test('opens the complete bundled Storybook manager from the guide', async ({ page }) => {
  await page.goto('/#/guide');
  const opened = page.waitForEvent('popup');
  await page.getByRole('link', { name: /^打开完整工作台/ }).click();
  const workbench = await opened;
  await expect(workbench).toHaveURL(/\/workbench\//);
  await expect(workbench.locator('#storybook-explorer-tree')).toBeVisible();
  await expect(workbench.frameLocator('#storybook-preview-iframe').locator('.kit-story-surface')).toBeVisible();
});

async function motionTime(exhibit: Locator) {
  const [elapsed, duration] = (await exhibit.locator('[data-motion-time]').innerText())
    .match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return { elapsed, duration };
}

async function waitForFrames(page: Page) {
  await page.evaluate(async () => {
    for (let frame = 0; frame < 5; frame += 1) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
  });
}

test('plays, pauses and replays the live MG canvas and stops drawing after route exit', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/motion');
  const exhibit = page.locator('[data-motion-exhibit="brand"]');
  const canvas = exhibit.locator('canvas');
  const play = exhibit.getByRole('button', { name: '播放动画', exact: true });
  const pause = exhibit.getByRole('button', { name: '暂停动画', exact: true });
  await expect(canvas).toBeVisible();
  await expect(play).toBeEnabled();
  const initial = await motionTime(exhibit);
  const initialFrame = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());

  await play.click();
  await expect(pause).toBeVisible();
  await expect.poll(async () => {
    const { elapsed } = await motionTime(exhibit);
    return elapsed > 0.05 && elapsed < initial.duration;
  }).toBe(true);
  await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL()))
    .not.toBe(initialFrame);
  await pause.click();
  await expect(play).toBeVisible();
  const paused = await motionTime(exhibit);
  await waitForFrames(page);
  expect(await motionTime(exhibit)).toEqual(paused);

  await exhibit.getByRole('button', { name: '查看终态', exact: true }).click();
  const final = await motionTime(exhibit);
  expect(final.duration).toBeGreaterThan(0);
  expect(final.elapsed).toBe(final.duration);
  await exhibit.getByRole('button', { name: '重播动画', exact: true }).click();
  await expect(pause).toBeVisible();
  await expect.poll(async () => (await motionTime(exhibit)).elapsed).toBeLessThan(final.duration);

  const retainedCanvas = await canvas.elementHandle();
  const nav = page.getByRole('navigation', { name: '主导航', exact: true });
  await nav.getByRole('link', { name: '指南', exact: true }).click();
  await expect(canvas).toHaveCount(0);
  const detachedFrame = await retainedCanvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
  await waitForFrames(page);
  expect(await retainedCanvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).toBe(detachedFrame);
  await retainedCanvas.dispose();
  await nav.getByRole('link', { name: '动效', exact: true }).click();
  await expect(canvas).toBeVisible();
  await expect(play).toBeEnabled();
});

test('keeps MG artwork available without autoplay under system reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/motion');
  const exhibit = page.locator('[data-motion-exhibit="brand"]');
  const canvas = exhibit.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(exhibit.getByRole('button', { name: '播放动画', exact: true })).toBeDisabled();
  await exhibit.getByRole('button', { name: '查看终态', exact: true }).click();
  await expect(exhibit.getByRole('status')).toHaveText('减少动态效果');
  const final = await motionTime(exhibit);
  expect(final.duration).toBeGreaterThan(0);
  expect(final.elapsed).toBe(final.duration);
  const staticFrame = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
  await waitForFrames(page);
  expect(await motionTime(exhibit)).toEqual(final);
  expect(await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).toBe(staticFrame);
});
