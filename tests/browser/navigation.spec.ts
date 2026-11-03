import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text());
    });
    await use(errors);
    expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});

type StoryEntry = { id: string; title: string; type: string; name: string; exportName?: string };

async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:standard') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === title
    && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

const tabsTitle = '基础组件/Tabs 标签页';
const dialogTitle = '基础组件/Dialog 对话框';

async function activePanel(page: Page) {
  const selected = page.getByRole('tab', { selected: true });
  const id = await selected.getAttribute('aria-controls');
  expect(id).toBeTruthy();
  return page.locator(`[id="${id}"]`);
}

async function expectFocusInside(dialog: Locator, message = 'Focus remains inside the open modal') {
  await expect.poll(() => dialog.evaluate(element => element.contains(element.ownerDocument.activeElement)), { message }).toBe(true);
}

async function scrollState(page: Page) {
  return page.evaluate(() => ({ root: getComputedStyle(document.documentElement).overflow, body: getComputedStyle(document.body).overflow }));
}

function isScrollLocked(state: Awaited<ReturnType<typeof scrollState>>) {
  return state.root === 'hidden' || state.body === 'hidden';
}

test.describe('Tabs', () => {
  test('links tabs to panels and automatically activates a looping keyboard selection', async ({ page }) => {
    await openStory(page, tabsTitle);
    const list = page.getByRole('tablist', { name: '组件文档' });
    const first = list.getByRole('tab', { name: '组件示例', exact: true });
    await expect(first).toHaveAttribute('aria-selected', 'true');
    const buttons = list.getByRole('tab');
    for (const button of await buttons.all()) {
      const id = await button.getAttribute('id');
      const controls = await button.getAttribute('aria-controls');
      await expect(page.locator(`[id="${controls}"]`)).toHaveAttribute('aria-labelledby', id!);
    }
    await expect(list.locator('[role="tab"][tabindex="0"]')).toHaveCount(1);
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(list.getByRole('tab', { name: '使用方式', exact: true })).toBeFocused();
    await expect(list.getByRole('tab', { name: '使用方式', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(list.getByRole('tab', { name: '交互约定', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(first).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(list.getByRole('tab', { name: '交互约定', exact: true })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(first).toBeFocused();
    await expect(await activePanel(page)).toBeVisible();
  });

  test('manual activation separates keyboard focus from selection until Enter or Space', async ({ page }) => {
    await openStory(page, tabsTitle, 'Manual');
    const first = page.getByRole('tab', { name: '组件示例', exact: true });
    const usage = page.getByRole('tab', { name: '使用方式', exact: true });
    const spec = page.getByRole('tab', { name: '交互约定', exact: true });
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(usage).toBeFocused();
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(usage).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(spec).toBeFocused();
    await expect(usage).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Space');
    await expect(spec).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Tab');
    await expect(await activePanel(page)).toBeFocused();
  });

  test('skips disabled items and brings long labels into view without widening a small page', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await openStory(page, tabsTitle, 'DisabledAndLongLabels', 'theme:dark;motion:standard');
    await expect(page.getByRole('tab', { name: '暂未开放', exact: true })).toBeDisabled();
    await page.getByRole('tab', { name: '组件示例', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: '实际项目中的完整使用方式', exact: true })).toBeFocused();
    await page.keyboard.press('End');
    const last = page.getByRole('tab', { name: '发布与迁移记录', exact: true });
    await expect(last).toBeFocused();
    await expect(last).toBeInViewport();
    const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(geometry.scroll).toBe(geometry.viewport);
  });

  test('preserves an edited form when its panel is hidden and reopened', async ({ page }) => {
    await openStory(page, tabsTitle);
    await page.getByLabel('演示项目名称').fill('保留这份编辑');
    await page.getByRole('tab', { name: '使用方式', exact: true }).click();
    await expect(page.getByLabel('演示项目名称')).toBeHidden();
    await page.getByRole('tab', { name: '组件示例', exact: true }).click();
    await expect(page.getByLabel('演示项目名称')).toHaveValue('保留这份编辑');
  });

  test('requests one controlled update per gesture and allows retrying until the parent confirms', async ({ page }) => {
    await openStory(page, tabsTitle, 'Controlled');
    const first = page.getByRole('tab', { name: '组件示例', exact: true });
    const usage = page.getByRole('tab', { name: '使用方式', exact: true });
    const status = page.getByRole('status');
    await usage.click();
    await expect(status).toHaveText('更新请求：1 次；最近请求：usage；父级值：preview');
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await usage.click();
    await expect(status).toHaveText('更新请求：2 次；最近请求：usage；父级值：preview');
    await usage.press('Enter');
    await expect(status).toHaveText('更新请求：3 次；最近请求：usage；父级值：preview');
    await usage.evaluate(element => (element as HTMLElement).click());
    await expect(status).toHaveText('更新请求：4 次；最近请求：usage；父级值：preview');
    await page.getByRole('button', { name: '确认最近请求', exact: true }).click();
    await expect(usage).toHaveAttribute('aria-selected', 'true');
    await usage.click();
    await expect(status).toHaveText('更新请求：4 次；最近请求：usage；父级值：usage');
  });

  test('handles disabled selections and empty or fully disabled directories without mutating the supplied value', async ({ page }) => {
    await openStory(page, tabsTitle, 'DynamicItems');
    await page.getByRole('tab', { name: '组件示例', exact: true }).focus();
    // Model an external data update while keyboard focus remains in the tablist.
    await page.getByRole('button', { name: '禁用首项', exact: true }).evaluate(element => (element as HTMLElement).click());
    await expect(page.getByRole('tab', { name: '使用方式', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: '使用方式', exact: true })).toBeFocused();
    await expect(page.getByText('父级值：preview', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '清空目录', exact: true }).click();
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.getByRole('tabpanel')).toHaveCount(0);
    await page.getByRole('button', { name: '恢复目录', exact: true }).click();
    await expect(page.getByRole('tab', { name: '使用方式', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: '交互约定', exact: true }).click();
    await expect(page.getByText('父级值：spec', { exact: true })).toBeVisible();
    await openStory(page, tabsTitle, 'AllDisabled');
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('tab', { selected: true })).toHaveCount(0);
    await expect(page.getByRole('tabpanel')).toHaveCount(0);
    await expect(page.locator('[role="tab"][tabindex="0"]')).toHaveCount(0);
  });
});

test.describe('Dialog', () => {
  test('opens a named modal, focuses the form and validates before saving', async ({ page }) => {
    await openStory(page, dialogTitle);
    const trigger = page.getByRole('button', { name: '打开配置对话框', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '新建工作空间', exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(await dialog.evaluate(element => element.matches(':modal'))).toBe(true);
    const description = await dialog.getAttribute('aria-describedby');
    await expect(page.locator(`[id="${description}"]`)).toHaveText('先给创作一个落点，更多设置可以稍后调整。');
    const name = dialog.getByLabel('工作空间名称');
    await expect(name).toBeFocused();
    await name.fill('');
    await dialog.getByRole('button', { name: '创建空间', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveText('请填写工作空间名称。');
    await expect(dialog).toBeVisible();
    await name.fill('真实配置空间');
    await dialog.getByRole('button', { name: '创建空间', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('「真实配置空间」已创建。');
    await expect(trigger).toBeFocused();
  });

  test('contains Tab and Shift+Tab, makes the background inert and restores focus after Escape', async ({ page }) => {
    await openStory(page, dialogTitle);
    const before = await scrollState(page);
    const trigger = page.getByRole('button', { name: '打开配置对话框', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '新建工作空间', exact: true });
    const first = dialog.getByRole('button', { name: '关闭对话框', exact: true });
    const last = dialog.getByRole('button', { name: '创建空间', exact: true });
    await last.focus();
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();
    await trigger.evaluate(element => element.focus());
    await expectFocusInside(dialog);
    expect(isScrollLocked(await scrollState(page))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await scrollState(page)).toEqual(before);

  });

  test('only dismisses on a complete backdrop gesture when explicitly enabled', async ({ page }) => {
    await openStory(page, dialogTitle);
    await page.getByRole('button', { name: '打开配置对话框', exact: true }).click();
    const defaultDialog = page.getByRole('dialog', { name: '新建工作空间', exact: true });
    await page.mouse.click(8, 8);
    await expect(defaultDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await openStory(page, dialogTitle, 'BackdropDismiss');
    await page.getByRole('button', { name: '打开可点遮罩关闭的对话框', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '查看设计说明', exact: true });
    const body = dialog.locator('.ui-dialog__body');
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(8, 8);
    await page.mouse.up();
    await expect(dialog).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(dialog).toBeHidden();
  });

  test('can reject Escape while keeping a visible and usable close action', async ({ page }) => {
    await openStory(page, dialogTitle, 'EscapeDisabled');
    const trigger = page.getByRole('button', { name: '打开关闭策略示例', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '先完成这一步', exact: true });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '关闭对话框', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('keeps rich editing, disclosure and native media controls in the modal keyboard sequence', async ({ page }) => {
    await openStory(page, dialogTitle, 'RichContent');
    const trigger = page.getByRole('button', { name: '打开富内容对话框', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '编辑与阅读', exact: true });
    await dialog.getByRole('button', { name: '关闭对话框', exact: true }).focus();
    const focusState = () => dialog.evaluate(element => ({
      inside: element.contains(element.ownerDocument.activeElement),
      pageFocused: element.ownerDocument.hasFocus(),
    }));
    const visited: { tag: string; label: string | null }[] = [];
    for (let index = 0; index < 24; index++) {
      await page.keyboard.press('Tab');
      await expect.poll(focusState, { message: `Forward Tab ${index + 1} remains inside the rich-content modal` }).toEqual({ inside: true, pageFocused: true });
      visited.push(await page.evaluate(() => ({
        tag: document.activeElement?.tagName || '',
        label: document.activeElement?.getAttribute('aria-label') || null,
      })));
    }
    expect(visited.some(item => item.label === '编辑说明')).toBe(true);
    expect(visited.some(item => item.tag === 'SUMMARY')).toBe(true);
    expect(visited.some(item => item.tag === 'AUDIO')).toBe(true);
    expect(visited.some(item => item.label === '不进入 Tab 的说明')).toBe(false);
    for (let index = 0; index < 12; index++) {
      await page.keyboard.press('Shift+Tab');
      await expect.poll(focusState, { message: `Reverse Tab ${index + 1} remains inside the rich-content modal` }).toEqual({ inside: true, pageFocused: true });
    }
    const editor = dialog.getByRole('textbox', { name: '编辑说明', exact: true });
    await editor.fill('可以直接编辑的说明');
    await expect(editor).toHaveText('可以直接编辑的说明');
    await dialog.locator('summary').focus();
    await page.keyboard.press('Space');
    await expect(dialog.locator('details')).toHaveJSProperty('open', true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('keeps long content and actions inside a small viewport while inheriting theme and reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    for (const theme of ['light', 'dark']) {
      await openStory(page, dialogTitle, 'LongContent', `theme:${theme};motion:reduced`);
      await page.getByRole('button', { name: '打开长内容对话框', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: '一份长卷', exact: true });
      const styles = await dialog.evaluate(element => {
        const style = getComputedStyle(element);
        const surface = document.querySelector('.kit-story-surface')!;
        return {
          color: style.color,
          inheritedColor: getComputedStyle(surface).getPropertyValue('--ui-color-text').trim(),
          animationName: style.animationName,
          animationDuration: style.animationDuration,
        };
      });
      expect(styles.animationName === 'none' || styles.animationDuration.split(',').every(value => parseFloat(value) === 0)).toBe(true);
      const normalizedToken = await dialog.evaluate((element, color) => {
        const probe = element.ownerDocument.createElement('span');
        probe.style.color = color;
        element.append(probe);
        const normalized = getComputedStyle(probe).color;
        probe.remove();
        return normalized;
      }, styles.inheritedColor);
      expect(styles.color).toBe(normalizedToken);
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(360);
      expect(box!.y + box!.height).toBeLessThanOrEqual(640);
      const body = dialog.locator('.ui-dialog__body');
      expect(await body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
      await body.evaluate(element => element.scrollTo(0, element.scrollHeight));
      await expect(dialog.getByRole('button', { name: '关闭对话框', exact: true })).toBeInViewport();
      await expect(dialog.getByRole('button', { name: '合上长卷', exact: true })).toBeInViewport();
      await dialog.getByRole('button', { name: '合上长卷', exact: true }).click();
      await expect(dialog).toBeHidden();
      const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(geometry.scroll).toBe(geometry.viewport);
    }
  });

  test('closes only the top nested modal and retains the outer scroll lock and focus', async ({ page }) => {
    await openStory(page, dialogTitle, 'Nested');
    const before = await scrollState(page);
    const trigger = page.getByRole('button', { name: '打开外层对话框', exact: true });
    await trigger.click();
    const outer = page.getByRole('dialog', { name: '工作空间设置', exact: true });
    const innerTrigger = outer.getByRole('button', { name: '打开内层对话框', exact: true });
    await innerTrigger.click();
    const inner = page.getByRole('dialog', { name: '补充说明', exact: true });
    await expect(inner).toBeVisible();
    await expectFocusInside(inner);
    await page.keyboard.press('Escape');
    await expect(inner).toBeHidden();
    await expect(outer).toBeVisible();
    await expect(innerTrigger).toBeFocused();
    expect(isScrollLocked(await scrollState(page))).toBe(true);
    await outer.getByRole('button', { name: '关闭设置', exact: true }).click();
    await expect(outer).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await scrollState(page)).toEqual(before);

    await trigger.click();
    await innerTrigger.click();
    await inner.getByRole('button', { name: '卸载两层对话框', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await scrollState(page)).toEqual(before);
    await trigger.click();
    await expect(outer).toBeVisible();
    await expect(inner).toBeHidden();
    await outer.getByRole('button', { name: '关闭设置', exact: true }).click();
    await expect(outer).toBeHidden();
  });

  test('releases its scroll lock when unmounted and can be mounted and opened again', async ({ page }) => {
    await openStory(page, dialogTitle, 'UnmountCleanup');
    const before = await scrollState(page);
    const trigger = page.getByRole('button', { name: '打开后卸载', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '卸载清理', exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '卸载当前对话框', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(await scrollState(page)).toEqual(before);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '正常关闭', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await scrollState(page)).toEqual(before);
  });

  test('synchronizes v-model when a native method=dialog form closes it', async ({ page }) => {
    await openStory(page, dialogTitle, 'NativeFormClose');
    const trigger = page.getByRole('button', { name: '打开原生表单示例', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '原生表单关闭', exact: true });
    await expect(page.getByRole('status')).toHaveText('v-model：打开');
    await dialog.getByRole('button', { name: '提交并关闭', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('v-model：关闭');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
  });

  test('restores existing scroll styles and priorities without overwriting a host change', async ({ page }) => {
    await openStory(page, dialogTitle);
    await page.getByRole('button', { name: '打开配置对话框', exact: true }).waitFor();
    await page.evaluate(() => {
      const root = document.documentElement;
      root.style.setProperty('overflow-x', 'clip', 'important');
      root.style.setProperty('overflow-y', 'scroll', 'important');
      root.style.setProperty('padding-inline-end', '9px', 'important');
      document.body.style.minHeight = '200vh';
    });
    const inlineStyles = () => page.evaluate(() => Object.fromEntries(
      ['overflow-x', 'overflow-y', 'padding-inline-end'].map(name => [name, {
        value: document.documentElement.style.getPropertyValue(name),
        priority: document.documentElement.style.getPropertyPriority(name),
      }]),
    ));
    const before = await inlineStyles();
    const trigger = page.getByRole('button', { name: '打开配置对话框', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '新建工作空间', exact: true });
    expect(isScrollLocked(await scrollState(page))).toBe(true);
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await inlineStyles()).toEqual(before);
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.evaluate(() => document.documentElement.style.setProperty('overflow-x', 'auto', 'important'));
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await inlineStyles()).toEqual({ ...before, 'overflow-x': { value: 'auto', priority: 'important' } });
    await page.evaluate(() => document.documentElement.style.setProperty('overflow-x', 'clip', 'important'));
    await trigger.click();
    await expect(dialog).toBeVisible();
    // A host may intentionally keep scrolling disabled with a new priority.
    await page.evaluate(() => document.documentElement.style.setProperty('overflow-x', 'hidden', 'important'));
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await inlineStyles()).toEqual({ ...before, 'overflow-x': { value: 'hidden', priority: 'important' } });
  });
});
