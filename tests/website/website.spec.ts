import { expect, test as base } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ browserErrors: void }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use();
    expect(errors).toEqual([]);
  }, { auto: true }],
});

const componentLinks = 'a[href^="#/components/"]';

test('opens the complete component catalog from the homepage CTA', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('main[data-site-page="home"]')).toBeVisible();
  await page.getByRole('link', { name: /^浏览组件/ }).click();
  await expect(page).toHaveURL(/#\/components$/);
  const catalog = page.locator('main[data-site-page="components"]');
  await expect(catalog.locator(componentLinks)).toHaveCount(100);
  await expect(catalog.locator('a[href="#/components/MInput"]')).toBeVisible();
});

test('searches component names in English and Chinese and clears a conflicting category', async ({ page }) => {
  await page.goto('/#/components');
  const catalog = page.locator('main[data-site-page="components"]');
  const search = catalog.getByRole('searchbox', { name: '搜索组件', exact: true });
  const dates = catalog.getByRole('navigation', { name: '组件分类', exact: true })
    .getByRole('button', { name: '日期与时间', exact: true });
  const input = catalog.locator('a[href="#/components/MInput"]');
  const qr = catalog.locator('a[href="#/components/MQRCode"]');

  await search.fill('m-input');
  await expect(input).toBeVisible();
  await expect(qr).toHaveCount(0);
  await search.fill('二维码');
  await expect(qr).toBeVisible();
  await expect(input).toHaveCount(0);

  await dates.click();
  await expect(dates).toHaveAttribute('aria-pressed', 'true');
  await expect(catalog.getByText('没有匹配的组件。', { exact: true })).toBeVisible();
  await expect(catalog.locator(componentLinks)).toHaveCount(0);
  await catalog.getByRole('button', { name: '清空筛选', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(catalog.locator(componentLinks)).toHaveCount(100);

  await dates.click();
  await expect(catalog.locator('a[href="#/components/MCalendar"]')).toBeVisible();
  await expect(input).toHaveCount(0);
});

test('runs real MInput stories and opens its native API and full Storybook docs', async ({ page }) => {
  await page.goto('/#/components/MInput');
  await expect(page.getByRole('heading', { name: '输入框', level: 1, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看源码', exact: true }))
    .toHaveAttribute('href', 'https://github.com/MaLaNg116/malang-ui/blob/main/src/components/MInput.vue');
  const sample = page.getByRole('region', { name: '让注意力留在文字里', exact: true });
  await sample.getByRole('textbox', { name: '项目名称', exact: true }).fill('墨色成章');
  await expect(sample.getByText('当前值：墨色成章', { exact: true })).toBeVisible();
  const preview = page.getByRole('region', { name: '组件预览', exact: true });
  await preview.scrollIntoViewIfNeeded();
  const story = preview.getByTitle('输入框 · 交互示例', { exact: true });
  const frame = story.contentFrame();
  const input = frame.getByRole('textbox', { name: '工作空间名称', exact: true });
  await expect(input).toBeEditable();
  await expect(story).not.toHaveAttribute('aria-hidden', 'true');
  await input.fill('清风铸印');
  await expect(frame.getByText('当前输入：清风铸印', { exact: true })).toBeVisible();

  await preview.getByRole('combobox', { name: '示例', exact: true }).selectOption({ label: '禁用' });
  await expect(input).toBeDisabled();
  await expect(input).toHaveValue('只读预览空间');
  await expect(story).not.toHaveAttribute('aria-hidden', 'true');

  await preview.getByRole('button', { name: 'API 文档', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'API 参考', level: 2, exact: true })).toBeFocused();
  await expect(page).toHaveURL(/#\/components\/MInput$/);
  const props = page.getByRole('table', { name: 'Props', exact: true });
  const model = props.getByRole('row').filter({ has: page.getByText('modelValue', { exact: true }) });
  await expect(model.getByRole('cell', { name: 'string', exact: true })).toBeVisible();
  await expect(model.getByRole('cell', { name: /^(?:''|"")$/ })).toBeVisible();
  const type = props.getByRole('row').filter({ has: page.getByText('type', { exact: true }) });
  await expect(type.getByRole('cell', { name: /^(?:'text'|"text"|text)$/ })).toBeVisible();

  const opened = page.waitForEvent('popup');
  await page.getByRole('link', { name: '在 Storybook 查看完整文档', exact: true }).click();
  const docs = await opened;
  await expect(docs).toHaveURL(url => url.pathname === '/workbench/iframe.html'
    && url.searchParams.get('viewMode') === 'docs'
    && url.searchParams.get('id') === '基础组件-input-输入框--文档');
  await expect(docs.getByRole('heading', { name: 'Input 输入框', exact: true })).toBeVisible();
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

async function copySnippet(page: Page, block: Locator, filename: string) {
  const code = await block.locator('pre code').textContent() ?? '';
  await block.getByRole('button', { name: `复制 ${filename} 代码`, exact: true }).click();
  await expect(block.getByRole('status')).toHaveText('代码已复制');
  await expect.poll(async () => {
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    return clipboard.replace(/\r\n?/g, '\n');
  }).toBe(code);
  return code;
}

test.describe('copying real code samples', () => {
  // Keep native clipboard operations from these two tests from overlapping.
  test.describe.configure({ mode: 'default' });

  test('copies the actual guide snippet and selects it for manual copying when permission fails', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#/guide');
    const block = page.getByRole('region', { name: 'FirstCanvas.vue', exact: true });
    const code = await copySnippet(page, block, 'FirstCanvas.vue');
    expect(code).toContain('MInput');

    await page.addInitScript(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: () => Promise.reject(new DOMException('Clipboard permission denied', 'NotAllowedError')),
      });
    });
    await page.reload();
    await block.getByRole('button', { name: '复制 FirstCanvas.vue 代码', exact: true }).click();
    const manual = block.getByRole('textbox', { name: '可手动复制的代码', exact: true });
    await expect(block.getByText('复制受限，可选中下方代码手动复制。', { exact: true })).toBeVisible();
    await expect(manual).toHaveAttribute('readonly', '');
    await expect(manual).toBeFocused();
    await expect(manual).toHaveValue(code);
    const selection = await manual.evaluate(element => {
      const input = element as HTMLTextAreaElement;
      return input.value.slice(input.selectionStart, input.selectionEnd);
    });
    expect(selection).toBe(code);
  });

  test('runs the native MButton examples, copies the chosen size and shows public defaults', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#/components/MButton');
    const levels = page.getByRole('region', { name: '明确操作的轻重', exact: true });
    await levels.getByRole('button', { name: '主要操作', exact: true }).click();
    await expect(levels.getByRole('status')).toHaveText('已触发：主要操作');

    const sizes = page.getByRole('region', { name: '与界面的密度相称', exact: true });
    const create = sizes.getByRole('button', { name: '创建项目', exact: true });
    const height = () => create.evaluate(button => button.getBoundingClientRect().height);
    const initialHeight = await height();
    const large = sizes.getByRole('radio', { name: '大尺寸', exact: true });
    await large.click();
    await expect(large).toBeChecked();
    await expect.poll(height).toBeGreaterThan(initialHeight);
    await sizes.locator('summary').click();
    const block = sizes.getByRole('region', { name: 'ButtonSizes.vue', exact: true });
    const code = await copySnippet(page, block, 'ButtonSizes.vue');
    expect(code).toContain('<MButton size="lg">创建项目</MButton>');
    const copy = block.getByRole('button', { name: '复制 ButtonSizes.vue 代码', exact: true });
    await expect(copy).toHaveText('已复制 ✓');
    await sizes.getByRole('radio', { name: '小尺寸', exact: true }).click();
    await expect(block.locator('pre code')).toContainText('<MButton size="sm">创建项目</MButton>');
    expect(await copy.innerText()).toBe('复制代码');

    await page.getByRole('navigation', { name: '本页目录', exact: true })
      .getByRole('button', { name: 'API 参考', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'API 参考', level: 2, exact: true })).toBeFocused();
    const props = page.getByRole('table', { name: 'Props', exact: true });
    const variant = props.getByRole('row').filter({ has: page.getByText('variant', { exact: true }) });
    const size = props.getByRole('row').filter({ has: page.getByText('size', { exact: true }) });
    await expect(variant.getByRole('cell', { name: /^(?:'primary'|"primary"|primary)$/ })).toBeVisible();
    await expect(size.getByRole('cell', { name: /^(?:'md'|"md"|md)$/ })).toBeVisible();
  });
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

test.describe('360px touch layout', () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test('navigates the website with the mobile menu and keeps long pages scrollable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/');
    const menu = page.getByRole('button', { name: '打开导航菜单', exact: true });
    const nav = page.getByRole('navigation', { name: '移动导航', exact: true });
    const width = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await expect(menu).toBeVisible();
    expect(await width()).toBeLessThanOrEqual(1);

    await menu.tap();
    await expect(page.getByRole('button', { name: '关闭导航菜单', exact: true }))
      .toHaveAttribute('aria-expanded', 'true');
    await nav.getByRole('link', { name: /^概览/ }).tap();
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();

    await menu.tap();
    await nav.getByRole('link', { name: /^组件/ }).tap();
    await expect(page.getByRole('heading', { name: '组件目录', exact: true })).toBeVisible();
    await expect(nav).toBeHidden();
    expect(await width()).toBeLessThanOrEqual(1);

    await page.mouse.move(180, 560);
    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await page.locator('main a[href="#/components/MInput"]').tap();
    await expect(page.getByRole('heading', { name: '输入框', level: 1, exact: true })).toBeVisible();
    expect(await width()).toBeLessThanOrEqual(1);
    await page.getByRole('navigation', { name: '本页目录', exact: true })
      .getByRole('button', { name: 'API 参考', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'API 参考', level: 2, exact: true })).toBeFocused();
    const api = page.getByRole('region', { name: 'Props 表格', exact: true });
    await api.press('ArrowRight');
    await expect.poll(() => api.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    expect(await width()).toBeLessThanOrEqual(1);

    await menu.tap();
    await nav.getByRole('link', { name: /^动效/ }).tap();
    await expect(page.locator('[data-motion-exhibit="brand"][data-motion-ready]')).toBeVisible();
    expect(await width()).toBeLessThanOrEqual(1);

    await menu.tap();
    await nav.getByRole('link', { name: /^指南/ }).tap();
    await expect(page.getByRole('region', { name: 'FirstCanvas.vue', exact: true })).toBeVisible();
    expect(await width()).toBeLessThanOrEqual(1);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
});
