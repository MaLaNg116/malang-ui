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
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '二级组件/DatePicker 日期历盘' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `DatePicker/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
function calendar(page: Page, label: string) { return page.getByRole('region', { name: label + '日历', exact: true }); }
function day(surface: Locator, iso: string) { return surface.getByRole('button', { name: iso, exact: true }); }
async function expectInViewport(surface: Locator) {
  await expect.poll(() => surface.evaluate(element => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.left >= 0 && box.top >= 0 && box.right <= document.documentElement.clientWidth && box.bottom <= document.documentElement.clientHeight;
  })).toBe(true);
}

test.describe('ISO date input and non-modal calendar', () => {
  test('separates keyboard focus from selection and permits natural Tab and outside focus', async ({ page }) => {
    await openStory(page);
    const input = page.getByRole('textbox', { name: '归档日期', exact: true });
    const trigger = page.getByRole('button', { name: /^(打开|收起)归档日期日历$/ });
    const surface = calendar(page, '归档日期');
    await expect(input).toHaveAttribute('type', 'text'); await expect(page.getByRole('combobox')).toHaveCount(0);
    await trigger.click(); await expect(surface).toBeVisible(); await expect(day(surface, '2024-02-29')).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-controls', (await surface.getAttribute('id'))!);
    await expect(surface.getByRole('columnheader').first()).toHaveAccessibleName('星期一');
    await expect(surface.getByRole('gridcell', { selected: true })).toHaveCount(1);
    await page.keyboard.press('ArrowLeft'); await expect(day(surface, '2024-02-28')).toBeFocused();
    await expect(surface.getByRole('gridcell', { selected: true }).getByRole('button')).toHaveAccessibleName('2024-02-29');
    await page.keyboard.press('Home'); await expect(day(surface, '2024-02-26')).toBeFocused();
    await page.keyboard.press('End'); await expect(day(surface, '2024-03-03')).toBeFocused();
    await page.keyboard.press('PageUp'); await expect(day(surface, '2024-02-03')).toBeFocused();
    await page.keyboard.press('PageDown'); await expect(day(surface, '2024-03-03')).toBeFocused();
    await page.keyboard.press('Shift+PageDown'); await expect(day(surface, '2025-03-03')).toBeFocused();
    await page.keyboard.press('Shift+PageUp'); await expect(day(surface, '2024-03-03')).toBeFocused();
    await expect(page.getByText('父日期：2024-02-29', { exact: true })).toBeVisible();
    await page.keyboard.press('Enter'); await expect(surface).toBeHidden(); await expect(input).toBeFocused();
    await expect(input).toHaveValue('2024-03-03');
    await input.press('ArrowDown'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape');
    await expect(input).toBeFocused(); await expect(input).toHaveValue('2024-03-03'); await expect(surface).toBeHidden();
    await input.press('ArrowDown'); await page.keyboard.press('Tab');
    await expect(surface.getByRole('button', { name: '定位今日', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    const outside = page.getByRole('textbox', { name: '日历外部备注', exact: true });
    await expect(outside).toBeFocused(); await expect(surface).toBeHidden();
    await input.fill('2024-03-10'); await trigger.click();
    await expect(page.getByText('父日期：2024-03-03', { exact: true })).toBeVisible();
    await outside.fill('继续归档'); await expect(surface).toBeHidden(); await expect(outside).toBeFocused();
    await expect(page.getByText('父日期：2024-03-10', { exact: true })).toBeVisible();
  });

  test('retains invalid drafts, clamps calendar focus at configured and supported boundaries, and exposes inverted ranges', async ({ page }) => {
    await openStory(page, 'Range');
    const input = page.getByRole('textbox', { name: '封卷日期', exact: true });
    await input.fill('2024-02-30'); await input.press('Enter');
    await expect(input).toHaveValue('2024-02-30');
    expect(await input.evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(false);
    await expect(page.getByText('父日期：2024-02-29', { exact: true })).toBeVisible();
    await input.fill('2024-02-26'); await input.press('Enter');
    await expect(input).toHaveAccessibleDescription(/日期不得早于 2024-02-27。/);
    await input.fill('2024-03-01'); await page.getByRole('textbox', { name: '日历外部备注', exact: true }).focus();
    await expect(page.getByText('父日期：2024-03-01', { exact: true })).toBeVisible();
    await input.press('ArrowDown'); const surface = calendar(page, '封卷日期');
    await page.keyboard.press('ArrowLeft'); await expect(day(surface, '2024-02-29')).toBeFocused();
    await page.keyboard.press('Home'); await expect(day(surface, '2024-02-27')).toBeFocused();
    await page.keyboard.press('ArrowLeft'); await expect(day(surface, '2024-02-27')).toBeFocused();
    await page.keyboard.press('PageDown'); await expect(day(surface, '2024-03-03')).toBeFocused();
    await page.keyboard.press('ArrowRight'); await expect(day(surface, '2024-03-03')).toBeFocused();
    await expect(day(surface, '2024-02-26')).toBeDisabled(); await expect(day(surface, '2024-03-04')).toBeDisabled();
    await expect(page.getByText('父日期：2024-03-01', { exact: true })).toBeVisible();

    await openStory(page, 'InvalidRange');
    const conflict = page.getByRole('textbox', { name: '冲突范围', exact: true });
    await expect(page.getByRole('alert')).toHaveText('日期范围配置无效：最早日期晚于最晚日期。');
    await page.getByRole('button', { name: '打开冲突范围日历', exact: true }).click();
    const conflictCalendar = calendar(page, '冲突范围'); await expect(conflictCalendar).toBeVisible();
    expect(await conflictCalendar.getByRole('grid').getByRole('button').evaluateAll(buttons => buttons.every(button => (button as HTMLButtonElement).disabled))).toBe(true);
    expect(await conflict.evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(false);
    await expect(conflict).toHaveValue('2024-02-15');

    await openStory(page, 'BoundaryYears');
    const boundary = page.getByRole('textbox', { name: '历法边界', exact: true });
    await boundary.press('ArrowDown'); const limits = calendar(page, '历法边界');
    for (const key of ['ArrowLeft', 'Home', 'PageUp', 'Shift+PageUp']) await page.keyboard.press(key);
    await expect(day(limits, '0001-01-01')).toBeFocused(); await expect(limits.getByRole('button', { name: '上一月', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape'); await page.getByRole('button', { name: '切换首末年份', exact: true }).click();
    await boundary.press('ArrowDown');
    for (const key of ['ArrowRight', 'End', 'PageDown', 'Shift+PageDown']) await page.keyboard.press(key);
    await expect(day(limits, '9999-12-31')).toBeFocused(); await expect(limits.getByRole('button', { name: '下一月', exact: true })).toBeDisabled();
    await expect(boundary).toHaveValue('9999-12-31');
  });

  test('retries declined typed and calendar requests and leaves invalid owner values visible until an explicit correction', async ({ page }) => {
    await openStory(page, 'Controlled');
    const input = page.getByRole('textbox', { name: '受控日期', exact: true });
    for (const count of [1, 2]) {
      await input.fill('2024-03-01'); await input.press('Enter'); await expect(input).toHaveValue('2024-02-29');
      await expect(page.getByRole('status')).toHaveText(`更新请求：${count} 次 · 父日期：2024-02-29`);
    }
    await input.press('ArrowDown'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    await expect(input).toHaveValue('2024-02-29'); await expect(page.getByRole('status')).toHaveText('更新请求：3 次 · 父日期：2024-02-29');
    await page.getByRole('button', { name: '清空受控日期', exact: true }).click();
    await expect(input).toHaveValue('2024-02-29'); await expect(page.getByRole('status')).toHaveText('更新请求：4 次 · 父日期：2024-02-29');
    await page.getByRole('button', { name: '接受后续更新', exact: true }).click();
    await input.fill('2024-03-01'); await input.press('Enter'); await expect(input).toHaveValue('2024-03-01');
    await page.getByRole('button', { name: '程序设置日期', exact: true }).click(); await expect(input).toHaveValue('2025-01-31');
    await page.getByRole('button', { name: '设为非法父值', exact: true }).click(); await expect(input).toHaveValue('2025-02-30');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await input.press('ArrowDown'); await page.keyboard.press('Escape'); await expect(input).toHaveValue('2025-02-30');
    await expect(page.getByRole('status')).toHaveText('更新请求：5 次 · 父日期：2025-02-30');
    await input.fill('2025-02-28'); await input.press('Enter'); await expect(input).toHaveValue('2025-02-28');
    await expect(page.getByRole('status')).toHaveText('更新请求：6 次 · 父日期：2025-02-28');
  });

  test('uses the actual text input for required, form association, native FormData, readonly and reset', async ({ page }) => {
    await openStory(page, 'FormAttributes');
    const input = page.getByRole('textbox', { name: '交付日期', exact: true });
    const submit = page.getByRole('button', { name: '提交日期表单', exact: true });
    await expect(input).toHaveAttribute('required', ''); await expect(input).toHaveAttribute('name', 'archive');
    await expect(input).toHaveAttribute('form', (await page.locator('form').getAttribute('id'))!);
    await submit.click(); await expect(input).toBeFocused(); await expect(page.getByRole('status')).toHaveText('尚未提交');
    await input.evaluate(element => {
      const control = element as HTMLInputElement;
      control.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); control.value = '未完成日期';
      control.dispatchEvent(new InputEvent('input', { bubbles: true, data: '未完成日期', isComposing: true }));
    });
    expect(await input.evaluate(element => (element as HTMLInputElement).validity.customError)).toBe(true);
    // Native reset must terminate the IME transaction even with no blur/compositionend.
    await input.evaluate(element => (element as HTMLInputElement).form!.reset());
    await expect(input).toBeFocused(); await expect(input).toHaveValue('');
    expect(await input.evaluate(element => (element as HTMLInputElement).validity.customError)).toBe(false);
    expect(await input.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
    await input.evaluate(element => {
      const control = element as HTMLInputElement;
      control.form!.reset(); control.value = '2024-03-01';
      control.dispatchEvent(new InputEvent('input', { bubbles: true, data: '2024-03-01' }));
    });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(input).toHaveValue('2024-03-01');
    await expect(page.getByRole('textbox', { name: '只读日期', exact: true })).toHaveValue('2024-03-02');
    await input.press('Enter');
    expect(await input.evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(true);
    await input.fill('2024-02-30'); await submit.click(); await expect(input).toBeFocused();
    expect(await input.evaluate(element => (element as HTMLInputElement).validationMessage)).toContain('请输入有效日期');
    await expect(input).toHaveValue('2024-02-30');
    await expect(page.getByRole('button', { name: '打开只读日期日历', exact: true })).toBeDisabled();
    await expect(page.getByRole('textbox', { name: '禁用日期', exact: true })).toBeDisabled();
    await input.fill('2024-03-01'); await input.press('Enter'); await submit.click();
    await expect(page.getByRole('status')).toHaveText('提交日期：2024-03-01 · 固定：2024-03-02 · 禁用：未提交');
    const entries = await page.locator('form').evaluate(element => [...new FormData(element as HTMLFormElement).entries()]);
    expect(entries).toEqual([['archive', '2024-03-01'], ['fixed', '2024-03-02']]);
    await input.press('ArrowDown'); await expect(calendar(page, '交付日期')).toBeVisible();
    await page.getByRole('button', { name: '锁定交付日期', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(calendar(page, '交付日期')).toBeHidden(); await expect(input).toHaveAttribute('readonly', '');
    await expect(page.getByRole('button', { name: '打开交付日期日历', exact: true })).toBeDisabled();
    await input.evaluate(element => { const control = element as HTMLInputElement; control.value = '2024-04-01'; control.dispatchEvent(new InputEvent('input', { bubbles: true })); });
    await expect(input).toHaveValue('2024-03-01');
    await page.getByRole('button', { name: '重置日期表单', exact: true }).click();
    await page.getByRole('button', { name: '允许编辑交付日期', exact: true }).click();
    await expect(input).toHaveValue(''); expect(await input.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
    await openStory(page, 'Error'); await expect(page.getByRole('textbox', { name: '归档日期', exact: true })).toHaveAccessibleDescription(/这一天尚未通过归档校验。/);
  });

  test('preserves Chinese drafts through owner rerenders and cleans an open calendar before remounting', async ({ page }) => {
    await openStory(page, 'CompositionAndLifecycle');
    const input = page.getByRole('textbox', { name: '中文草稿日期', exact: true });
    await input.focus();
    await input.evaluate(element => {
      const control = element as HTMLInputElement;
      control.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); control.value = '二〇二四';
      control.dispatchEvent(new InputEvent('input', { bubbles: true, data: '二〇二四', isComposing: true }));
      control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true }));
    });
    await expect(input).toHaveValue('二〇二四'); await expect(page.getByText('提示已更新，未提交草稿继续保留。', { exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('父日期：2024-02-29 · 更新：0 次');
    expect(await input.evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(false);
    await input.evaluate(element => {
      (element as HTMLInputElement).value = '2024-03-04';
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '2024-03-04' }));
      element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '2024-03-04', isComposing: false }));
    });
    await expect(page.getByRole('status')).toHaveText('父日期：2024-02-29 · 更新：0 次');
    await input.press('Enter'); await expect(page.getByRole('status')).toHaveText('父日期：2024-03-04 · 更新：1 次');
    await input.fill('2024-02-30'); await page.getByRole('textbox', { name: '历盘外部字段', exact: true }).focus();
    await expect(input).toHaveValue('2024-02-30'); await expect(page.getByRole('status')).toHaveText('父日期：2024-03-04 · 更新：1 次');
    await input.press('ArrowDown'); const surface = calendar(page, '中文草稿日期'); await expect(surface).toBeVisible(); const id = await surface.getAttribute('id');
    await page.getByRole('button', { name: '卸载日期组件', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(surface).toHaveCount(0); await expect(page.locator(`[id="${id}"]`)).toHaveCount(0);
    await page.setViewportSize({ width: 640, height: 600 });
    await page.getByRole('button', { name: '重新挂载日期组件', exact: true }).click(); await expect(input).toHaveValue('2024-03-04');
    await input.press('ArrowDown'); await expect(surface).toBeVisible(); expect(await surface.getAttribute('id')).not.toBe(id);
    await page.keyboard.press('Escape'); await expect(input).toBeFocused(); await expect(surface).toBeHidden();
  });

  test('keeps a 44px touch calendar in a 360px viewport and supports both reduced-motion sources and forced colors', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
    const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      for (const source of ['container', 'system']) {
        await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
        await openStory(page, 'Default', `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`);
        await page.getByRole('button', { name: '打开归档日期日历', exact: true }).click();
        const surface = calendar(page, '归档日期'); await expect(surface).toBeVisible(); await expectInViewport(surface);
        const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })); expect(size.scroll).toBe(size.width);
        for (const target of [day(surface, '2024-02-29'), surface.getByRole('button', { name: '上一月', exact: true }), page.getByRole('button', { name: '收起归档日期日历', exact: true })]) {
          const box = (await target.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
        }
        expect(await surface.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
      }
      await page.emulateMedia({ forcedColors: 'active' });
      expect(await calendar(page, '归档日期').evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
      expect(await day(calendar(page, '归档日期'), '2024-02-29').evaluate(element => getComputedStyle(element).forcedColorAdjust)).toBe('none');
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
