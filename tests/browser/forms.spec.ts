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

const checkboxTitle = '基础组件/Checkbox 复选框';
const radioTitle = '基础组件/RadioGroup 单选组';
const selectTitle = '基础组件/Select 选择器';
const textareaTitle = '基础组件/Textarea 多行输入';

async function expectDescriptions(page: Page, control: Locator) {
  const ids = (await control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
}

test.describe('Native form components', () => {
  test('checkbox supports Space, an owned mixed state, and repeated controlled requests', async ({ page }) => {
    await openStory(page, checkboxTitle);
    const checkbox = page.getByRole('checkbox', { name: '接收更新提醒', exact: true });
    await expect(checkbox).not.toBeChecked();
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
    await expectDescriptions(page, checkbox);

    await openStory(page, checkboxTitle, 'Indeterminate');
    const mixed = page.getByRole('checkbox', { name: '选择全部档案', exact: true });
    await expect(mixed).toHaveAttribute('aria-checked', 'mixed');
    await expect.poll(() => mixed.evaluate(element => (element as HTMLInputElement).indeterminate)).toBe(true);
    await mixed.click();
    await expect(mixed).toBeChecked();
    await expect(mixed).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => mixed.evaluate(element => (element as HTMLInputElement).indeterminate)).toBe(false);

    await openStory(page, checkboxTitle, 'Controlled');
    const controlled = page.getByRole('checkbox', { name: '由父页面确认选择', exact: true });
    await controlled.click();
    await expect(controlled).not.toBeChecked();
    await expect(page.getByRole('status')).toHaveText('更新请求：1 次');
    await controlled.click();
    await expect(controlled).not.toBeChecked();
    await expect(page.getByRole('status')).toHaveText('更新请求：2 次');
  });

  test('radio arrows skip disabled options and a rejected update restores the checked source', async ({ page }) => {
    await openStory(page, radioTitle);
    const group = page.getByRole('radiogroup', { name: '选择界面方案', exact: true });
    const balanced = group.getByRole('radio', { name: '均衡', exact: false });
    const expressive = group.getByRole('radio', { name: '表现', exact: false });
    await expect(balanced).toBeChecked();
    await expect(group.getByRole('radio', { name: '实验方案', exact: false })).toBeDisabled();
    await balanced.focus();
    await page.keyboard.press('ArrowRight');
    await expect(expressive).toBeFocused();
    await expect(expressive).toBeChecked();
    await expect(balanced).not.toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(balanced).toBeChecked();
    await expectDescriptions(page, group);

    await openStory(page, radioTitle, 'Controlled');
    const controlled = page.getByRole('radiogroup', { name: '受控界面方案', exact: true });
    await controlled.getByRole('radio', { name: '表现', exact: false }).click();
    await expect(controlled.getByRole('radio', { name: '均衡', exact: false })).toBeChecked();
    await expect(controlled.getByRole('radio', { name: '表现', exact: false })).not.toBeChecked();
    await expect(page.getByRole('status')).toHaveText('更新请求：1 次');

    await openStory(page, radioTitle, 'IndependentGroups');
    const first = page.getByRole('radiogroup', { name: '第一组方案', exact: true });
    const second = page.getByRole('radiogroup', { name: '第二组方案', exact: true });
    const firstName = await first.getByRole('radio').first().getAttribute('name');
    const secondName = await second.getByRole('radio').first().getAttribute('name');
    expect(firstName).toBeTruthy();
    expect(secondName).toBeTruthy();
    expect(firstName).not.toBe(secondName);
    await first.getByRole('radio', { name: '表现', exact: false }).check();
    await expect(first.getByRole('radio', { name: '表现', exact: false })).toBeChecked();
    await expect(second.getByRole('radio', { name: '均衡', exact: false })).toBeChecked();
    await expect(page.getByRole('status')).toHaveText('第一组：expressive；第二组：balanced');
  });

  test('select keeps its native placeholder, options and controlled value', async ({ page }) => {
    await openStory(page, selectTitle);
    const select = page.getByRole('combobox', { name: '档案分类', exact: true });
    await expect(select).toHaveValue('');
    await expect(select.locator('option[value=""]')).toBeDisabled();
    await expect(select.locator('option[value="locked"]')).toBeDisabled();
    await select.selectOption('motion');
    await expect(select).toHaveValue('motion');
    await expectDescriptions(page, select);

    await openStory(page, selectTitle, 'Controlled');
    const controlled = page.getByRole('combobox', { name: '受控档案分类', exact: true });
    await controlled.selectOption('motion');
    await expect(controlled).toHaveValue('design');
    await expect(page.getByRole('status')).toHaveText('更新请求：1 次');
    await controlled.selectOption('motion');
    await expect(controlled).toHaveValue('design');
    await expect(page.getByRole('status')).toHaveText('更新请求：2 次');
  });

  test('textarea preserves composition through a parent update and enforces native maxlength', async ({ page }) => {
    await openStory(page, textareaTitle, 'CompositionWithChangingHint');
    const textarea = page.getByRole('textbox', { name: '中文项目说明', exact: true });
    await textarea.evaluate(element => {
      element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      (element as HTMLTextAreaElement).value = '水墨项目说明';
      element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '水墨项目说明', isComposing: true }));
    });
    await expect(page.getByText('提示已更新，尚未提交的中文仍应保留。', { exact: true })).toBeVisible();
    await expect(textarea).toHaveValue('水墨项目说明');
    await expect(page.getByTestId('textarea-value')).toHaveText('已提交：尚未提交');
    await textarea.evaluate(element => {
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '水墨项目说明' }));
      element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '水墨项目说明', isComposing: false }));
    });
    await expect(page.getByTestId('textarea-value')).toHaveText('已提交：水墨项目说明');
    await expect(page.getByTestId('textarea-updates')).toHaveText('模型更新：1 次');

    await openStory(page, textareaTitle, 'FormAttributes');
    const native = page.getByRole('textbox', { name: '归档说明', exact: true });
    await expect(native).toHaveAttribute('name', 'notes');
    await expect(native).toHaveAttribute('maxlength', '200');
    await expect(native).toHaveAttribute('rows', '3');
    await expect(native).toHaveAttribute('autocomplete', 'off');
    await native.focus();
    await page.keyboard.insertText('墨'.repeat(220));
    await expect(native).toHaveValue('墨'.repeat(200));
  });

  test('native required validation and FormData work for all four controls', async ({ page }) => {
    for (const [title, submit, expected] of [
      [checkboxTitle, '提交选择', '条款值：yes'],
      [radioTitle, '提交方案', '提交方案：expressive'],
      [selectTitle, '提交分类', '提交分类：motion'],
      [textareaTitle, '提交说明', '提交说明：完整归档说明'],
    ]) {
      await openStory(page, title, 'FormAttributes');
      const button = page.getByRole('button', { name: submit, exact: true });
      await button.click();
      await expect(page.getByRole('status')).toHaveText('尚未提交');
      if (title === checkboxTitle) {
        const control = page.getByRole('checkbox', { name: '接受使用条款', exact: true });
        await expect(control).toHaveAttribute('name', 'terms');
        await expect(control).toHaveAttribute('value', 'yes');
        await expect(control).toHaveAttribute('required', '');
        await control.check();
      } else if (title === radioTitle) {
        const control = page.getByRole('radiogroup', { name: '归档方案', exact: true }).getByRole('radio', { name: '表现', exact: false });
        await expect(control).toHaveAttribute('name', 'scheme');
        await expect(control).toHaveAttribute('required', '');
        await control.check();
      } else if (title === selectTitle) {
        const control = page.getByRole('combobox', { name: '提交分类', exact: true });
        await expect(control).toHaveAttribute('name', 'category');
        await expect(control).toHaveAttribute('required', '');
        await expect(control).toHaveAttribute('autocomplete', 'off');
        await control.selectOption('motion');
      } else {
        const control = page.getByRole('textbox', { name: '归档说明', exact: true });
        await expect(control).toHaveAttribute('required', '');
        await control.fill('完整归档说明');
      }
      await button.click();
      await expect(page.getByRole('status')).toHaveText(expected);
    }
  });

  test('error descriptions and disabled native states stay associated and readable', async ({ page }) => {
    for (const [title, role, name, message] of [
      [checkboxTitle, 'checkbox', '接收更新提醒', '请确认此项后继续。'],
      [radioTitle, 'radiogroup', '选择界面方案', '请选择一个界面方案。'],
      [selectTitle, 'combobox', '档案分类', '请选择档案分类。'],
      [textareaTitle, 'textbox', '项目说明', '请再补充一些项目背景。'],
    ] as const) {
      await openStory(page, title, 'Error', 'theme:dark;motion:reduced');
      const control = page.getByRole(role, { name, exact: true });
      await expect(control).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByRole('alert')).toHaveText(message);
      await expectDescriptions(page, control);
    }
    for (const [title, role, name] of [
      [checkboxTitle, 'checkbox', '接收更新提醒'],
      [radioTitle, 'radio', '均衡'],
      [selectTitle, 'combobox', '档案分类'],
      [textareaTitle, 'textbox', '项目说明'],
    ] as const) {
      await openStory(page, title, 'Disabled');
      await expect(page.getByRole(role, { name, exact: role !== 'radio' })).toBeDisabled();
    }
  });

  test('coarse targets, compact fields and reduced feedback remain usable at 360px', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const globals = 'theme:dark;density:compact;motion:reduced';
      await openStory(page, checkboxTitle, 'Default', globals);
      const checkbox = page.getByRole('checkbox', { name: '接收更新提醒', exact: true });
      await checkbox.check();
      expect((await page.locator('.ui-checkbox__label').boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await openStory(page, radioTitle, 'Default', globals);
      const radios = page.getByRole('radio');
      await radios.last().check();
      for (const option of await page.locator('.ui-radio-group__option').all()) expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await openStory(page, selectTitle, 'Default', globals);
      const select = page.getByRole('combobox', { name: '档案分类', exact: true });
      await select.selectOption('motion');
      expect((await select.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await openStory(page, textareaTitle, 'Default', globals);
      const textarea = page.getByRole('textbox', { name: '项目说明', exact: true });
      await textarea.fill('窄屏也能清楚地输入。');
      expect((await textarea.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      const state = await textarea.evaluate(element => ({
        fontSize: parseFloat(getComputedStyle(element).fontSize),
        duration: getComputedStyle(element).transitionDuration,
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      expect(state.fontSize).toBeGreaterThanOrEqual(16);
      expect(state.duration.split(',').every(value => parseFloat(value) === 0)).toBe(true);
      expect(state.scroll).toBe(state.viewport);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
