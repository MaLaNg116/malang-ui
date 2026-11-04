import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

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
const menuTitle = '二级组件/Menu 导航菜单', treeTitle = '二级组件/Tree 层级目录';
async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:dark;motion:standard') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const entries = (await response.json() as { entries: Record<string, StoryEntry> }).entries;
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(entries).find(entry => entry.type === 'story' && entry.title === title && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}
async function expectQuiet(locator: Locator) {
  expect(await locator.evaluate(element => {
    const style = getComputedStyle(element);
    return style.animationName === 'none' && style.transitionDuration.split(',').every(value => parseFloat(value) === 0);
  })).toBe(true);
}
function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
  return errors;
}

test.describe('Application navigation', () => {
  test('keeps native links, modifier and middle clicks, disclosure keys and disabled destinations', async ({ page }) => {
    await openStory(page, menuTitle);
    const nav = page.getByRole('navigation', { name: '档案工作台导航', exact: true });
    const archive = nav.getByRole('button', { name: '资产归档', exact: true });
    const overview = nav.getByRole('link', { name: '归档总览', exact: true });
    const images = nav.getByRole('link', { name: '图像资料', exact: true, includeHidden: true });
    await expect(nav.getByRole('list')).toHaveCount(2);
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(overview).toHaveAttribute('aria-current', 'page');
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
    expect(await archive.getAttribute('href')).toBeNull();
    const controlledId = await archive.getAttribute('aria-controls');
    await expect(page.locator(`[id="${controlledId}"]`)).toBeVisible();
    const sourceUrl = page.url();
    for (const method of ['modifier', 'middle']) {
      // Browser-created modifier/middle-click tabs can have no opener. Observe
      // the context page event rather than requiring a source-page popup event.
      const opened = page.context().waitForEvent('page');
      await images.click(method === 'modifier' ? { modifiers: ['Control'] } : { button: 'middle' });
      const newTab = await opened;
      await expect(newTab).toHaveURL(/#images$/);
      await newTab.close();
      await expect(page).toHaveURL(sourceUrl);
      await expect(overview).toHaveAttribute('aria-current', 'page');
      await expect(page.getByRole('status')).toContainText('尚未切换入口');
    }
    await images.click();
    await expect(page).toHaveURL(/#images$/);
    await expect(images).toHaveAttribute('aria-current', 'page');
    const locked = nav.getByRole('link', { name: '封存入口', exact: true });
    await expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(await locked.getAttribute('href')).toBeNull();
    await locked.focus();
    await locked.press('Enter');
    expect(await locked.evaluate(element => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    })).toBe(true);
    await expect(page).toHaveURL(/#images$/);
    await expect(images).toHaveAttribute('aria-current', 'page');
    await archive.focus();
    await archive.press('Space');
    await expect(images).toBeHidden();
    await archive.press('Enter');
    await archive.press('Tab');
    await expect(images).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(nav.getByRole('button', { name: '动态编排', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(nav.getByRole('button', { name: '工作台设置', exact: true })).toBeFocused();
    await images.focus();
    await images.press('Escape');
    await expect(archive).toBeFocused();
    await expect(archive).toHaveAttribute('aria-expanded', 'false');
    await expect(images).toHaveAttribute('aria-current', 'page');
  });

  test('retries controlled requests and repairs hidden, removed and reordered focus without taking an external draft', async ({ page }) => {
    await openStory(page, menuTitle, 'Controlled');
    const nav = page.getByRole('navigation', { name: '受控档案导航', exact: true });
    const images = nav.getByRole('link', { name: '图像资料', exact: true });
    const originalUrl = page.url();
    await images.click(); await images.click();
    await expect(page.getByRole('status')).toContainText('选择请求：2 次');
    await expect(page.getByRole('status')).toContainText('已接管链接：true');
    await expect(page).toHaveURL(originalUrl);
    await expect(nav.getByRole('link', { name: '归档总览', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: '接受导航请求', exact: true }).click();
    await expect(images).toHaveAttribute('aria-current', 'page');
    const archive = nav.getByRole('button', { name: '资产归档', exact: true });
    await archive.click(); await archive.click();
    await expect(page.getByRole('status')).toContainText('展开请求：2 次');
    await expect(archive).toHaveAttribute('aria-expanded', 'true');
    const accept = page.getByRole('button', { name: '接受展开请求', exact: true });
    await accept.click();
    await expect(images).toBeHidden();
    await expect(accept).toBeFocused();

    await openStory(page, menuTitle, 'Dynamic');
    const dynamic = page.getByRole('navigation', { name: '动态档案导航', exact: true });
    const imageEntry = dynamic.getByRole('link', { name: '图像资料', exact: true });
    const group = dynamic.getByRole('button', { name: '资产归档', exact: true });
    await imageEntry.focus();
    await page.getByRole('button', { name: '重排导航', exact: true }).click();
    await expect(imageEntry).toBeFocused();
    await page.getByRole('button', { name: '从外部收起分组', exact: true }).click();
    await expect(group).toBeFocused();
    await expect(page.getByRole('status')).toContainText('父模型：images');
    await group.click(); await imageEntry.focus();
    await page.getByRole('button', { name: '移除图像入口', exact: true }).click();
    await expect(imageEntry).toHaveCount(0);
    await expect(group).toBeFocused();
    await expect(dynamic.locator('[aria-current="page"]')).toHaveCount(0);
    const draft = page.getByRole('textbox', { name: '导航外部草稿', exact: true });
    await draft.fill('未提交的中文草稿');
    await page.getByRole('button', { name: '重排导航', exact: true }).click();
    await expect(draft).toBeFocused();
    await expect(draft).toHaveValue('未提交的中文草稿');
  });

  test('handles invalid and empty navigation and stays readable in both themes, narrow touch and reduced motion', async ({ page, browser }) => {
    await openStory(page, menuTitle, 'InvalidValues');
    await expect(page.getByRole('navigation').locator('[aria-current="page"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '资产归档', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await openStory(page, menuTitle, 'Empty');
    await expect(page.getByRole('navigation')).toHaveAccessibleName('档案工作台导航');
    await expect(page.getByText('暂无导航项目', { exact: true })).toBeVisible();
    await openStory(page, menuTitle, 'Disabled');
    await expect(page.getByRole('button', { name: '资产归档', exact: true })).toBeDisabled();
    await expect(page.getByRole('link', { name: '图像资料', exact: true })).toHaveAttribute('aria-disabled', 'true');

    const touch = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, baseURL: 'http://127.0.0.1:6007' });
    try {
      const narrow = await touch.newPage(); const errors = captureErrors(narrow);
      for (const theme of ['light', 'dark']) {
        await openStory(narrow, menuTitle, 'LongLabels', `theme:${theme};motion:reduced`);
        await noOverflow(narrow);
        const controls = narrow.getByRole('navigation').locator('a, button');
        for (const control of await controls.all()) {
          expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
          await expectQuiet(control);
        }
        const long = narrow.getByRole('link', { name: 'LongAssetArchiveReferenceWithoutArtificialTruncation'.repeat(3), exact: true });
        const box = await long.boundingBox(); expect(box!.height).toBeGreaterThan(44);
      }
      await narrow.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
      await openStory(narrow, menuTitle, 'Default', 'theme:dark;motion:standard');
      const group = narrow.getByRole('button', { name: '资产归档', exact: true });
      await expectQuiet(group);
      await group.focus();
      expect(await group.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
      expect(errors).toEqual([]);
    } finally { await touch.close(); }
  });
});

test.describe('Single-select directory tree', () => {
  test('uses one tab stop and independent selection with tree arrows, typeahead, composition guards and explicit activation', async ({ page }) => {
    await openStory(page, treeTitle);
    const tree = page.getByRole('tree', { name: '资产归档目录', exact: true });
    const node = (name: string) => tree.getByRole('treeitem', { name, exact: true, includeHidden: true });
    const alpha = node('Alpha · 水墨界面'), beta = node('Beta · 机械切面'), assets = node('素材总卷'), design = node('设计资料'), locked = node('封存目录');
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
    await expect(alpha).toHaveAttribute('tabindex', '0');
    await expect(alpha).toHaveAttribute('aria-selected', 'true');
    expect(await alpha.getAttribute('aria-expanded')).toBeNull();
    await page.keyboard.press('Tab');
    await expect(alpha).toBeFocused();
    await alpha.press('ArrowDown');
    await expect(beta).toBeFocused();
    await expect(alpha).toHaveAttribute('aria-selected', 'true');
    await beta.press('Home'); await expect(assets).toBeFocused();
    await assets.press('ArrowLeft');
    await expect(assets).toHaveAttribute('aria-expanded', 'false');
    await expect(alpha).toBeHidden();
    await expect(alpha).toHaveAttribute('aria-selected', 'true');
    await assets.press('End'); await expect(node('发布记录')).toBeFocused();
    await page.keyboard.press('ArrowUp'); await expect(locked).toBeFocused();
    await locked.press('Enter'); await locked.press('ArrowRight');
    await expect(locked).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('status')).toContainText('已选择：alpha');
    await locked.press('Home'); await assets.press('ArrowRight');
    await expect(assets).toBeFocused();
    await assets.press('ArrowRight'); await expect(design).toBeFocused();
    await design.press('ArrowRight'); await expect(alpha).toBeFocused();
    await alpha.press('ArrowLeft'); await expect(design).toBeFocused();
    await design.press('Home'); await assets.press('a'); await expect(alpha).toBeFocused();
    await alpha.press('a'); await expect(node('Audio · 动作音效')).toBeFocused();
    await page.waitForTimeout(750);
    await page.keyboard.press('b'); await page.keyboard.press('e'); await expect(beta).toBeFocused();
    await beta.dispatchEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true });
    await beta.dispatchEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true });
    await beta.press('Control+Enter');
    await expect(alpha).toHaveAttribute('aria-selected', 'true');
    await beta.press('Space');
    await expect(beta).toHaveAttribute('aria-selected', 'true');
    await expect(alpha).toHaveAttribute('aria-selected', 'false');
    await beta.press('Tab');
    await expect(tree.locator(':focus')).toHaveCount(0);
  });

  test('retries controlled selection and expansion, preserves disabled descendants and repairs data updates without stealing drafts', async ({ page }) => {
    await openStory(page, treeTitle, 'Controlled');
    const controlled = page.getByRole('tree', { name: '受控资产目录', exact: true });
    const alpha = controlled.getByRole('treeitem', { name: 'Alpha · 水墨界面', exact: true });
    await expect(controlled.locator('[aria-selected="true"]')).toHaveCount(0);
    await alpha.focus(); await alpha.press('Enter'); await alpha.press('Enter');
    await expect(page.getByRole('status')).toContainText('选择请求：2 次');
    await expect(alpha).toHaveAttribute('aria-selected', 'false');
    await page.getByRole('button', { name: '接受目录选择', exact: true }).click();
    await expect(alpha).toHaveAttribute('aria-selected', 'true');
    const design = controlled.getByRole('treeitem', { name: '设计资料', exact: true });
    await design.focus(); await design.press('ArrowLeft'); await design.press('ArrowLeft');
    await expect(page.getByRole('status')).toContainText('展开请求：2 次');
    await expect(design).toHaveAttribute('aria-expanded', 'true');
    const accept = page.getByRole('button', { name: '接受目录开合', exact: true });
    await accept.click(); await expect(design).toHaveAttribute('aria-expanded', 'false');
    await expect(accept).toBeFocused();

    await openStory(page, treeTitle, 'DisabledParent');
    const tree = page.getByRole('tree', { name: '资产归档目录', exact: true });
    const locked = tree.getByRole('treeitem', { name: '封存目录', exact: true });
    const child = tree.getByRole('treeitem', { name: '封存子卷', exact: true });
    const release = tree.getByRole('treeitem', { name: '发布记录', exact: true });
    await release.focus(); await release.press('Enter');
    await locked.focus(); await locked.press('Enter'); await locked.press('ArrowLeft');
    await expect(locked).toHaveAttribute('aria-expanded', 'true');
    await expect(release).toHaveAttribute('aria-selected', 'true');
    await locked.press('ArrowDown'); await expect(child).toBeFocused();
    await child.press('Enter'); await expect(child).toHaveAttribute('aria-selected', 'true');
    expect(await child.getAttribute('aria-disabled')).toBeNull();

    await openStory(page, treeTitle, 'Dynamic');
    const dynamic = page.getByRole('tree', { name: '动态资产目录', exact: true });
    const ink = dynamic.getByRole('treeitem', { name: 'Alpha · 水墨界面', exact: true });
    const folder = dynamic.getByRole('treeitem', { name: '设计资料', exact: true });
    const originalId = await ink.getAttribute('id');
    await ink.focus();
    await page.getByRole('button', { name: '重排目录', exact: true }).click();
    await expect(ink).toBeFocused(); await expect(ink).toHaveAttribute('id', originalId!);
    await page.getByRole('button', { name: '从外部收起设计资料', exact: true }).click();
    await expect(folder).toBeFocused(); await expect(ink).toBeHidden();
    await expect(page.getByRole('status')).toContainText('父模型：alpha');
    await folder.press('ArrowRight'); await ink.focus();
    await page.getByRole('button', { name: '移除水墨节点', exact: true }).click();
    await expect(ink).toHaveCount(0); await expect(folder).toBeFocused();
    await expect(dynamic.locator('[aria-selected="true"]')).toHaveCount(0);
    const draft = page.getByRole('textbox', { name: '目录外部草稿', exact: true });
    await draft.fill('目录之外的未提交草稿');
    await page.getByRole('button', { name: '重排目录', exact: true }).click();
    await expect(draft).toBeFocused(); await expect(draft).toHaveValue('目录之外的未提交草稿');
    await folder.focus(); await page.getByRole('button', { name: '清空目录', exact: true }).click();
    await expect(dynamic).toBeFocused();
    await expect(dynamic.getByRole('treeitem')).toHaveCount(0);
    await expect(dynamic).toHaveAttribute('tabindex', '0');
    await expect(page.getByText('暂无目录项目', { exact: true })).toBeVisible();
  });

  test('keeps empty and globally disabled trees discoverable and long touch rows readable in both reduced-motion sources and themes', async ({ page, browser }) => {
    await openStory(page, treeTitle, 'Empty');
    const empty = page.getByRole('tree', { name: '资产归档目录', exact: true });
    await page.keyboard.press('Tab'); await expect(empty).toBeFocused();
    await expect(empty.getByRole('treeitem')).toHaveCount(0);
    await openStory(page, treeTitle, 'Disabled');
    const tree = page.getByRole('tree', { name: '资产归档目录', exact: true });
    const alpha = tree.getByRole('treeitem', { name: 'Alpha · 水墨界面', exact: true });
    const design = tree.getByRole('treeitem', { name: '设计资料', exact: true });
    await alpha.focus(); await alpha.press('ArrowDown'); await page.keyboard.press('Enter');
    await expect(alpha).toHaveAttribute('aria-selected', 'true');
    await design.focus(); await design.press('ArrowLeft');
    await expect(design).toHaveAttribute('aria-expanded', 'true');

    const touch = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, baseURL: 'http://127.0.0.1:6007' });
    try {
      const narrow = await touch.newPage(); const errors = captureErrors(narrow);
      for (const theme of ['light', 'dark']) {
        await openStory(narrow, treeTitle, 'LongLabels', `theme:${theme};motion:reduced`);
        await noOverflow(narrow);
        const rows = narrow.getByRole('tree').locator('.ui-tree__row');
        for (const row of await rows.all()) { expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44); await expectQuiet(row); }
        const long = narrow.getByRole('treeitem', { name: 'LongAssetArchiveReferenceWithoutArtificialTruncation'.repeat(3), exact: true });
        await expect(long).toHaveAttribute('aria-selected', 'true');
        expect((await long.boundingBox())!.height).toBeGreaterThan(44);
        await long.focus(); expect(await long.evaluate(element => getComputedStyle(element.firstElementChild!).outlineStyle)).toBe('solid');
      }
      await narrow.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
      await openStory(narrow, treeTitle, 'Default', 'theme:dark;motion:standard');
      const row = narrow.getByRole('treeitem', { name: 'Alpha · 水墨界面', exact: true }).locator('.ui-tree__row');
      await expectQuiet(row);
      const item = narrow.getByRole('treeitem', { name: 'Alpha · 水墨界面', exact: true });
      await item.focus(); expect(await item.evaluate(element => getComputedStyle(element.firstElementChild!).outlineStyle)).toBe('solid');
      expect(errors).toEqual([]);
    } finally { await touch.close(); }
  });
});
