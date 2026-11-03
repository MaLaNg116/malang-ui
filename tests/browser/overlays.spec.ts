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

type StoryEntry = { id: string; title: string; type: string; exportName?: string };

async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === title
    && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
}

const popoverTitle = '基础组件/Popover 气泡';
const tooltipTitle = '基础组件/Tooltip 提示';

async function scrollState(page: Page) {
  return page.evaluate(() => ({ root: getComputedStyle(document.documentElement).overflow, body: getComputedStyle(document.body).overflow }));
}

async function expectInsideViewport(surface: Locator) {
  await expect.poll(() => surface.evaluate(element => {
    const box = element.getBoundingClientRect();
    const document = element.ownerDocument;
    return box.width > 0 && box.height > 0 && box.left >= 0 && box.top >= 0
      && box.right <= document.documentElement.clientWidth && box.bottom <= document.documentElement.clientHeight;
  }), { message: 'Floating content stays within the visible viewport' }).toBe(true);
}

async function expectNoPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}

async function openTimedTooltip(page: Page, exportedName = 'Default') {
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await openStory(page, tooltipTitle, exportedName);
  await page.getByRole('button', { name: exportedName === 'UnmountCleanup' ? '可卸载提示' : '保存草稿说明', exact: true }).waitFor();
  await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z'));
}

test.describe('Popover', () => {
  test('links the trigger to a nonmodal editor and preserves focus through save, Escape and outside editing', async ({ page }) => {
    await openStory(page, popoverTitle);
    const trigger = page.getByRole('button', { name: '打开编辑气泡', exact: true });
    const panel = page.getByRole('dialog', { name: '编辑备注', exact: true });
    const field = page.getByLabel('备注内容', { exact: true });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const controls = await trigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    const initialScroll = await scrollState(page);

    await trigger.focus();
    await trigger.press('Enter');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('id', controls!);
    await expect(panel).not.toHaveAttribute('aria-modal', 'true');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(field).toBeFocused();
    expect(await scrollState(page)).toEqual(initialScroll);
    await field.fill('保留这次修改');
    await panel.getByRole('button', { name: '保存备注', exact: true }).click();
    await expect(panel).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('备注已更新：保留这次修改');
    await expect(trigger).toBeFocused();

    await trigger.press('Space');
    await expect(field).toBeFocused();
    await expect(field).toHaveValue('保留这次修改');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(panel).toBeVisible();
    const outside = page.getByLabel('外部输入框', { exact: true });
    await outside.click();
    await expect(panel).toBeHidden();
    await expect(outside).toBeFocused();
    await outside.fill('继续外部任务');
    await expect(outside).toHaveValue('继续外部任务');
    expect(await scrollState(page)).toEqual(initialScroll);
  });

  test('does not open when disabled and lets a controlled owner decline and retry close requests', async ({ page }) => {
    await openStory(page, popoverTitle, 'Disabled');
    const disabled = page.getByRole('button', { name: '打开编辑气泡', exact: true });
    await expect(disabled).toBeDisabled();
    await disabled.evaluate(element => (element as HTMLButtonElement).click());
    await expect(page.getByRole('dialog', { name: '编辑备注', exact: true })).toBeHidden();
    await expect(disabled).toHaveAttribute('aria-expanded', 'false');

    await openStory(page, popoverTitle, 'Controlled');
    await page.getByRole('button', { name: '改为拒绝关闭', exact: true }).click();
    const trigger = page.getByRole('button', { name: '打开受控气泡', exact: true });
    const panel = page.getByRole('dialog', { name: '受控气泡', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(panel).toBeVisible();
    await expect(page.getByText('更新请求：1', { exact: true })).toBeVisible();
    const close = panel.getByRole('button', { name: '请求关闭气泡', exact: true });
    await close.click();
    await expect(page.getByText('更新请求：2', { exact: true })).toBeVisible();
    await expect(panel).toBeVisible();
    await close.click();
    await expect(page.getByText('更新请求：3', { exact: true })).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByText('更新请求：4', { exact: true })).toBeVisible();
    await expect(panel).toBeVisible();
    // An external owner can accept the next request without first light-dismissing the popup.
    await page.getByRole('button', { name: '允许关闭', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await panel.getByRole('button', { name: '关闭气泡', exact: true }).click();
    await expect(page.getByText('更新请求：5', { exact: true })).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('keeps an edge popup inside a 360px viewport and follows its anchor when the scroll container moves', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openStory(page, popoverTitle, 'EdgeAndScroll', 'theme:dark;motion:reduced');
    const trigger = page.getByRole('button', { name: '打开边缘气泡', exact: true });
    await trigger.click();
    const panel = page.getByRole('dialog', { name: '边缘说明', exact: true });
    await expect(panel).toBeVisible();
    await expectInsideViewport(panel);
    await expectNoPageOverflow(page);
    const before = await panel.boundingBox();
    expect(before).not.toBeNull();
    const anchorMovement = await trigger.evaluate(element => {
      let parent = element.parentElement;
      while (parent && !(parent.scrollHeight > parent.clientHeight && /auto|scroll/.test(getComputedStyle(parent).overflowY))) parent = parent.parentElement;
      if (!parent) throw new Error('The edge story must provide a scrollable anchor container');
      const initial = element.getBoundingClientRect().top;
      parent.scrollTop += 60;
      return element.getBoundingClientRect().top - initial;
    });
    expect(anchorMovement).toBeLessThan(-40);
    await expect.poll(async () => {
      const after = await panel.boundingBox();
      return after ? Math.abs(after.y - before!.y - anchorMovement) : Infinity;
    }, { message: 'Popover follows the same scroll displacement as its trigger' }).toBeLessThan(2);
    await expectInsideViewport(panel);
    await page.setViewportSize({ width: 520, height: 780 });
    await expectInsideViewport(panel);
    await expectNoPageOverflow(page);
  });

  test('does not retain focus intents after a controlled owner declines an open or close request', async ({ page }) => {
    await openStory(page, popoverTitle, 'ControlledFocus');
    const trigger = page.getByRole('button', { name: '请求打开焦点气泡', exact: true });
    const panel = page.getByRole('dialog', { name: '受控焦点说明', exact: true });
    const outside = page.getByLabel('焦点示例外部输入框', { exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    await expect(page.getByTestId('popover-focus-requests')).toHaveText('焦点示例请求：1 次');
    await expect(panel).toBeHidden();

    await outside.focus();
    // Change the controlled model without introducing another pointer focus.
    await page.getByRole('button', { name: '程序打开焦点气泡', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(panel).toBeVisible();
    await expect(outside).toBeFocused();

    await panel.getByRole('button', { name: '关闭气泡', exact: true }).click();
    await expect(page.getByTestId('popover-focus-requests')).toHaveText('焦点示例请求：2 次');
    await expect(panel).toBeVisible();
    await outside.focus();
    await page.getByRole('button', { name: '程序关闭焦点气泡', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(panel).toBeHidden();
    await expect(outside).toBeFocused();
  });

  test('closes only the topmost popup on Escape before releasing its containing dialog', async ({ page }) => {
    await openStory(page, popoverTitle, 'InDialog', 'theme:dark;motion:reduced');
    const outerTrigger = page.getByRole('button', { name: '打开含气泡的对话框', exact: true });
    await outerTrigger.waitFor();
    const initialScroll = await scrollState(page);
    await outerTrigger.click();
    const modal = page.getByRole('dialog', { name: '编辑说明', exact: true });
    await expect(modal).toBeVisible();
    const modalScroll = await scrollState(page);
    expect(modalScroll.root === 'hidden' || modalScroll.body === 'hidden').toBe(true);
    const trigger = modal.getByRole('button', { name: '打开行内气泡', exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const panel = page.getByRole('dialog', { name: '行内说明', exact: true });
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(modal).toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await scrollState(page)).toEqual(modalScroll);
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(outerTrigger).toBeFocused();
    expect(await scrollState(page)).toEqual(initialScroll);
  });
});

test.describe('Tooltip', () => {
  test('provides a description on focus and suppresses Escape reopening until a fresh interaction', async ({ page }) => {
    await openTimedTooltip(page);
    const trigger = page.getByRole('button', { name: '保存草稿说明', exact: true });
    const description = await trigger.getAttribute('aria-describedby');
    expect(description).toBeTruthy();
    const surface = page.locator(`[id="${description}"]`);
    await expect(surface).toHaveAttribute('role', 'tooltip');
    await expect(trigger).toHaveAccessibleDescription('将当前编辑内容保存在工作空间中。');
    await trigger.focus();
    await expect(surface).toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(surface.getByRole('button')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(surface).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.clock.runFor(1_000);
    await expect(surface).toBeHidden();
    await page.getByRole('heading', { name: '说明到位，动作不停。', exact: true }).click();
    await expect(trigger).not.toBeFocused();
    await trigger.focus();
    await expect(surface).toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('respects hover delay and remains open while the pointer crosses into the tooltip text', async ({ page }) => {
    await openTimedTooltip(page);
    const trigger = page.getByRole('button', { name: '保存草稿说明', exact: true });
    const surface = page.getByRole('tooltip');
    await trigger.hover();
    await page.clock.runFor(299);
    await expect(surface).toBeHidden();
    await page.clock.runFor(1);
    await expect(surface).toBeVisible();
    await expect(trigger).not.toBeFocused();
    await surface.hover();
    await page.clock.runFor(500);
    await expect(surface).toBeVisible();
    const viewport = page.viewportSize()!;
    await page.mouse.move(viewport.width - 10, viewport.height - 10);
    await page.clock.runFor(500);
    await expect(surface).toBeHidden();
  });

  test('omits disabled descriptions and wraps long text within a small viewport', async ({ page }) => {
    await openStory(page, tooltipTitle, 'Disabled');
    const disabled = page.getByRole('button', { name: '保存草稿说明', exact: true });
    await expect(disabled).toBeDisabled();
    await expect(disabled).not.toHaveAttribute('aria-describedby');
    await disabled.hover();
    await disabled.evaluate(element => (element as HTMLButtonElement).focus());
    await expect(disabled).not.toBeFocused();
    await expect(page.getByRole('tooltip')).toBeHidden();

    await page.setViewportSize({ width: 360, height: 650 });
    await openStory(page, tooltipTitle, 'LongContent', 'theme:dark;motion:reduced');
    const trigger = page.getByRole('button', { name: '长说明', exact: true });
    await trigger.focus();
    const surface = page.getByRole('tooltip');
    await expect(surface).toHaveText('这是一段更完整的操作说明。'.repeat(8) + 'LongReferenceWithoutArtificialClipping'.repeat(4));
    await expect(surface).toBeVisible();
    await expectInsideViewport(surface);
    expect(await surface.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expectNoPageOverflow(page);
    await expect(trigger).toBeFocused();

    // Both sources of reduced motion stop the plaque and its decorative seating line.
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, tooltipTitle, 'LongContent', `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`);
      await trigger.focus();
      await expect(surface).toBeVisible();
      expect(await surface.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
      expect(await surface.locator('.ui-tooltip__seam').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    }

    // Short viewports scroll the text within the cut frame and keep the last line reachable.
    await page.setViewportSize({ width: 360, height: 240 });
    await expectInsideViewport(surface);
    const copy = surface.locator('.ui-tooltip__content');
    expect(await copy.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await copy.evaluate(element => { element.scrollTop = element.scrollHeight; });
    expect(await copy.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await expectNoPageOverflow(page);
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await surface.evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
  });

  test('cleans pending timers and open positioning when unmounted, then mounts a usable fresh instance', async ({ page }) => {
    await openTimedTooltip(page, 'UnmountCleanup');
    const trigger = page.getByRole('button', { name: '可卸载提示', exact: true });
    const firstId = await trigger.getAttribute('aria-describedby');
    await trigger.hover();
    await page.clock.runFor(200);
    // Remove from the owner while the pointer is still on the trigger, so mouseleave cannot do the cleanup.
    await page.getByRole('button', { name: '卸载提示组件', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(trigger).toHaveCount(0);
    await expect(page.locator(`[id="${firstId}"]`)).toHaveCount(0);
    await page.clock.runFor(1_000);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.getByRole('button', { name: '重新挂载提示组件', exact: true }).click();
    await trigger.focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    const secondId = await trigger.getAttribute('aria-describedby');
    expect(secondId).not.toBe(firstId);
    await page.getByRole('button', { name: '卸载提示组件', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(page.locator(`[id="${secondId}"]`)).toHaveCount(0);
    await page.setViewportSize({ width: 540, height: 720 });
    await page.clock.runFor(1_000);
    await page.getByRole('button', { name: '重新挂载提示组件', exact: true }).click();
    await trigger.focus();
    await expect(page.getByRole('tooltip')).toHaveCount(1);
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
