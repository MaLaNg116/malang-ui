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
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '二级组件/Combobox 搜索选择' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Combobox/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function expectActive(page: Page, combo: Locator, name: string) {
  const option = page.getByRole('option', { name, exact: true });
  await expect(option).toHaveAttribute('aria-selected', 'true');
  await expect(combo).toHaveAttribute('aria-activedescendant', (await option.getAttribute('id'))!);
  await expect(combo).toBeFocused();
}
async function expectInViewport(surface: Locator) {
  await expect.poll(() => surface.evaluate(element => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && box.left >= 0 && box.top >= 0 && box.right <= document.documentElement.clientWidth && box.bottom <= document.documentElement.clientHeight;
  })).toBe(true);
}
async function expectNoOverflow(page: Page) {
  const size = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(size.scroll).toBe(size.width);
}

test.describe('Searchable single-choice combobox', () => {
  test('keeps input focus while navigating, commits only options and restores the previous choice after an unmatched query', async ({ page }) => {
    await openStory(page);
    const combo = page.getByRole('combobox', { name: '演示方案', exact: true });
    const list = page.getByRole('listbox', { name: '演示方案候选', exact: true });
    await expect(combo).toHaveAttribute('aria-autocomplete', 'list');
    await expect(combo).toHaveAttribute('aria-expanded', 'false');
    await combo.focus(); await combo.press('ArrowDown');
    await expect(list).toBeVisible(); await expect(list.getByRole('option')).toHaveCount(5);
    await expect(combo).toHaveAttribute('aria-controls', (await list.getAttribute('id'))!);
    await expectActive(page, combo, '朱砂落印');
    await combo.press('ArrowDown'); await expectActive(page, combo, '青玉回响');
    await combo.press('ArrowDown'); await expectActive(page, combo, '冷钢构形');
    await expect(list.getByRole('option', { name: '旧卷封存', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await combo.press('Home'); await expectActive(page, combo, '朱砂落印');
    await combo.press('End'); await expectActive(page, combo, '素纸留白');
    await combo.press('Enter'); await expect(list).toBeHidden();
    await expect(combo).toHaveValue('素纸留白'); await expect(combo).toBeFocused();
    await expect(page.getByText('当前方案：paper', { exact: true })).toBeVisible();

    // Closed Home/End belong to text editing rather than hidden option navigation.
    await combo.press('Home'); expect(await combo.evaluate(element => (element as HTMLInputElement).selectionStart)).toBe(0);
    await expect(combo).toHaveAttribute('aria-expanded', 'false');
    await combo.press('End'); expect(await combo.evaluate(element => (element as HTMLInputElement).selectionStart)).toBe('素纸留白'.length);
    await combo.fill('找不到这份方案');
    await expect(list.getByRole('option')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('没有匹配选项。');
    await expect(page.getByText('当前方案：paper', { exact: true })).toBeVisible();
    expect(await combo.evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(false);
    await combo.press('Escape'); await expect(list).toBeHidden(); await expect(combo).toHaveValue('素纸留白');
    await combo.fill('jade'); await expect(list.getByRole('option')).toHaveCount(1);
    await combo.press('Enter'); await expect(combo).toHaveValue('青玉回响');
    await page.getByRole('button', { name: '清空演示方案', exact: true }).click();
    await expect(combo).toHaveValue(''); await expect(page.getByText('当前方案：尚未选择', { exact: true })).toBeVisible();
    await combo.press('ArrowDown'); await expect(list).toBeVisible();
    const outside = page.getByRole('textbox', { name: '候选外部备注', exact: true });
    await outside.fill('继续编辑'); await expect(list).toBeHidden(); await expect(outside).toBeFocused();
  });

  test('restores declined selections and clear requests, then follows programmatic and accepted owner values', async ({ page }) => {
    await openStory(page, 'Controlled');
    const combo = page.getByRole('combobox', { name: '受控方案', exact: true });
    const list = page.getByRole('listbox', { name: '受控方案候选', exact: true });
    await combo.focus(); await combo.press('ArrowDown'); await combo.press('ArrowDown'); await combo.press('Enter');
    await expect(combo).toHaveValue('朱砂落印'); await expect(list).toBeHidden();
    await expect(page.getByText('更新请求：1 次 · 父模型：ink', { exact: true })).toBeVisible();
    await combo.fill('青玉'); await combo.press('Enter');
    await expect(combo).toHaveValue('朱砂落印');
    await expect(page.getByText('更新请求：2 次 · 父模型：ink', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '清空受控方案', exact: true }).click();
    await expect(combo).toHaveValue('朱砂落印');
    await expect(page.getByText('更新请求：3 次 · 父模型：ink', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '程序切换方案', exact: true }).click(); await expect(combo).toHaveValue('素纸留白');
    await page.getByRole('button', { name: '接受后续更新', exact: true }).click();
    await combo.fill('冷钢'); await combo.press('Enter'); await expect(combo).toHaveValue('冷钢构形');
    await expect(page.getByText('更新请求：4 次 · 父模型：steel', { exact: true })).toBeVisible();
    await combo.press('ControlOrMeta+A'); await combo.press('Backspace');
    await expect(page.getByText('更新请求：5 次 · 父模型：', { exact: true })).toBeVisible();
    await expect(combo).toHaveValue('');
  });

  test('preserves unfinished Chinese composition through hint updates and never accepts its confirmation Enter as a choice', async ({ page }) => {
    await openStory(page, 'Composition');
    const combo = page.getByRole('combobox', { name: '中文方案', exact: true });
    const list = page.getByRole('listbox', { name: '中文方案候选', exact: true });
    await combo.focus(); await combo.press('ArrowDown');
    await combo.evaluate(element => {
      const input = element as HTMLInputElement;
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })); input.value = '青玉';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '青玉', isComposing: true }));
    });
    await expect(page.getByText('提示已更新，未提交文字继续保留。', { exact: true })).toBeVisible();
    await expect(combo).toHaveValue('青玉'); await expect(list.getByRole('option')).toHaveCount(5);
    await combo.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })));
    await expect(page.getByText('父模型：ink · 模型更新：0 次', { exact: true })).toBeVisible();
    await combo.evaluate(element => {
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '青玉' }));
      element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '青玉', isComposing: false }));
    });
    await expect(list.getByRole('option')).toHaveCount(1); await expectActive(page, combo, '青玉回响');
    await expect(page.getByText('父模型：ink · 模型更新：0 次', { exact: true })).toBeVisible();
    await combo.press('Enter'); await expect(combo).toHaveValue('青玉回响');
    await expect(page.getByText('父模型：jade · 模型更新：1 次', { exact: true })).toBeVisible();
  });

  test('validates actual choices and submits selected values while readonly and disabled controls retain native semantics', async ({ page }) => {
    await openStory(page, 'FormAttributes');
    const combo = page.getByRole('combobox', { name: '交付方案', exact: true });
    const readonly = page.getByRole('combobox', { name: '只读方案', exact: true });
    const disabled = page.getByRole('combobox', { name: '禁用方案', exact: true });
    const submit = page.getByRole('button', { name: '提交交付方案', exact: true });
    await expect(combo).toHaveAttribute('required', ''); await submit.click();
    await expect(page.getByText('尚未提交', { exact: true })).toBeVisible(); await expect(combo).toBeFocused();
    expect(await combo.evaluate(element => (element as HTMLInputElement).validationMessage)).toBe('请从候选列表中选择一项。');
    await combo.fill('随意输入不等于选择'); expect(await combo.evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(false);
    await combo.press('Escape'); await combo.press('ArrowDown'); await combo.press('ArrowDown'); await combo.press('Enter');
    await expect(combo).toHaveValue('青玉回响');
    await expect(readonly).toHaveAttribute('readonly', ''); await readonly.click(); await readonly.press('ArrowDown');
    await expect(readonly).toHaveAttribute('aria-expanded', 'false'); await expect(readonly).toHaveValue('朱砂落印');
    await expect(page.getByRole('button', { name: '展开只读方案候选', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: '清空只读方案', exact: true })).toHaveCount(0);
    await expect(disabled).toBeDisabled();
    await submit.click(); await expect(page.getByText('提交方案：jade · 只读：ink · 禁用：未提交', { exact: true })).toBeVisible();
    const values = await page.locator('form').evaluate(form => [...new FormData(form as HTMLFormElement).entries()]);
    expect(values).toEqual([['preset', 'jade'], ['readonlyPreset', 'ink']]);
    await page.getByRole('button', { name: '重置方案', exact: true }).click(); await expect(combo).toHaveValue('');
    expect(await combo.evaluate(element => (element as HTMLInputElement).validity.valid)).toBe(false);

    await openStory(page, 'Error'); const error = page.getByRole('combobox', { name: '演示方案', exact: true });
    await expect(error).toHaveAttribute('aria-invalid', 'true'); await expect(error).toHaveAccessibleDescription(/请从候选中选择一份方案。/);
  });

  test('keeps long candidates reachable on touch screens, respects both motion preferences and cleans an open instance before remounting', async ({ page, browser }) => {
    const touch = await browser.newContext({ viewport: { width: 360, height: 360 }, isMobile: true, hasTouch: true });
    const touchPage = await touch.newPage(); const errors: string[] = [];
    touchPage.on('pageerror', error => errors.push(error.message));
    touchPage.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      for (const source of ['container', 'system']) {
        await touchPage.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
        await openStory(touchPage, 'LongContent', `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`);
        const combo = touchPage.getByRole('combobox', { name: '长清单方案', exact: true });
        await combo.focus(); await combo.press('ArrowDown'); const list = touchPage.getByRole('listbox', { name: '长清单方案候选', exact: true });
        await expect(list).toBeVisible(); await expectInViewport(list); await expectNoOverflow(touchPage);
        await combo.press('End'); await expectActive(touchPage, combo, '最后一份方案');
        const last = list.getByRole('option', { name: '最后一份方案', exact: true });
        await expectInViewport(last); expect(await list.locator('.ui-combobox__options').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
        expect(await list.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
        const trigger = touchPage.getByRole('button', { name: '收起长清单方案候选', exact: true });
        const box = await trigger.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      await touchPage.emulateMedia({ forcedColors: 'active' });
      expect(await touchPage.getByRole('listbox').evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
      expect(errors).toEqual([]);
    } finally { await touch.close(); }

    await openStory(page, 'UnmountCleanup');
    const combo = page.getByRole('combobox', { name: '可卸载方案', exact: true });
    await combo.focus(); await combo.press('ArrowDown'); const id = await combo.getAttribute('aria-controls');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.getByRole('button', { name: '卸载候选组件', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
    await expect(combo).toHaveCount(0); await expect(page.locator(`[id="${id}"]`)).toHaveCount(0);
    await page.setViewportSize({ width: 640, height: 500 });
    await page.getByRole('button', { name: '重新挂载候选组件', exact: true }).click();
    expect(await combo.getAttribute('aria-controls')).not.toBe(id);
    await combo.focus(); await combo.press('ArrowDown'); await expect(page.getByRole('listbox')).toBeVisible();
    await combo.press('Escape'); await expect(page.getByRole('listbox')).toBeHidden(); await expect(combo).toBeFocused();
  });
});
