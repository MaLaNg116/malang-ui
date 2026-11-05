import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    await use(errors); expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:light;palette:paper;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = entries.find(entry => entry.type === 'story' && entry.title === '基础组件/Segmented 分段选择' && (entry.exportName === exportedName || entry.id.endsWith('--' + suffix)));
  expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
  await page.locator('.ui-segmented').first().waitFor();
}
async function aligned(group: Locator) {
  await expect.poll(() => group.evaluate(element => {
    const selected = element.querySelector('.ui-segmented__option[data-selected]'), indicator = element.querySelector('.ui-segmented__indicator');
    if (!selected || !indicator || getComputedStyle(indicator).visibility !== 'visible') return false;
    const item = selected.getBoundingClientRect(), box = indicator.getBoundingClientRect();
    return Math.abs(item.left - box.left) < .8 && Math.abs(item.top - box.top) < .8 && Math.abs(item.width - box.width) < .8 && Math.abs(item.height - box.height) < .8;
  })).toBe(true);
}
async function noPageOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true); }

test.describe('Mechanical segmented selection', () => {
  test('uses native grouped radios, skips disabled options and keeps independent sizes and vertical groups independent', async ({ page }) => {
    await openStory(page);
    const group = page.getByRole('group', { name: '工作视图', exact: true });
    expect(await group.evaluate(element => element.tagName)).toBe('FIELDSET');
    await expect(group.getByRole('radio')).toHaveCount(4); await expect(page.getByRole('tab')).toHaveCount(0);
    const overview = group.getByRole('radio', { name: '总览', exact: true }), canvas = group.getByRole('radio', { name: '画布', exact: true }), archive = group.getByRole('radio', { name: '归档', exact: true });
    await expect(overview).toBeChecked(); await expect(overview).toHaveAccessibleDescription('看清当前工作面。');
    await expect(group.getByRole('radio', { name: '审核', exact: true })).toBeDisabled();
    await overview.focus(); await overview.press('ArrowRight'); await expect(canvas).toBeChecked(); await expect(canvas).toBeFocused();
    await canvas.press('ArrowDown'); await expect(archive).toBeChecked();
    await archive.press('ArrowRight'); await expect(overview).toBeChecked();
    await archive.focus(); await archive.press('Space'); await expect(archive).toBeChecked();
    await expect(page.locator('[data-segment-model]')).toHaveText('当前视图：archive'); await expect(group.locator('input:checked')).toHaveCount(1); await aligned(group);

    await openStory(page, 'SizesAndOrientation');
    const compact = page.getByRole('group', { name: '紧凑视图', exact: true }), normal = page.getByRole('group', { name: '常规视图', exact: true });
    expect(await compact.getByRole('radio').first().getAttribute('name')).not.toBe(await normal.getByRole('radio').first().getAttribute('name'));
    await compact.getByRole('radio', { name: '归档', exact: true }).click();
    await expect(normal.getByRole('radio', { name: '画布', exact: true })).toBeChecked();
    const vertical = page.getByRole('group', { name: '纵向工具', exact: true });
    await vertical.getByRole('radio', { name: '画布', exact: true }).press('ArrowUp');
    await expect(vertical.getByRole('radio', { name: '总览', exact: true })).toBeChecked(); await aligned(vertical);
    expect(await page.getByRole('group', { name: '锁定视图', exact: true }).getByRole('radio').evaluateAll(inputs => inputs.every(input => input.matches(':disabled')))).toBe(true);
  });

  test('restores a declined controlled request, retries the same value and never substitutes an unknown owner value', async ({ page }) => {
    await openStory(page, 'Controlled');
    const group = page.getByRole('group', { name: '受控工作视图', exact: true });
    const overview = group.getByRole('radio', { name: '总览', exact: true }), canvas = group.getByRole('radio', { name: '画布', exact: true });
    for (let request = 1; request <= 2; request++) {
      await canvas.click(); await expect(overview).toBeChecked(); await expect(canvas).not.toBeChecked();
      await expect(page.getByRole('status')).toHaveText(`更新请求：${request} 次 · 父模型：overview · 最近请求：canvas`);
      await aligned(group);
    }
    await canvas.focus(); await canvas.press('Space');
    await expect(page.getByRole('status')).toHaveText('更新请求：3 次 · 父模型：overview · 最近请求：canvas'); await expect(overview).toBeChecked();
    await page.getByRole('button', { name: '允许更新', exact: true }).click(); await canvas.focus(); await canvas.press('Space');
    await expect(canvas).toBeChecked(); await expect(page.getByRole('status')).toHaveText('更新请求：4 次 · 父模型：canvas · 最近请求：canvas'); await aligned(group);
    await page.getByRole('button', { name: '设为不可用值', exact: true }).click();
    await expect(group.locator('input:checked')).toHaveCount(0); await expect(group.locator('.ui-segmented__indicator')).toBeHidden();
    await expect(page.getByRole('status')).toHaveText('更新请求：4 次 · 父模型：missing · 最近请求：canvas');
    await group.getByRole('radio', { name: '归档', exact: true }).press('Space');
    await expect(page.getByRole('status')).toHaveText('更新请求：5 次 · 父模型：archive · 最近请求：archive'); await aligned(group);
  });

  test('submits a real external form, preserves current ownership through native resets and excludes disabled controls', async ({ page }) => {
    await openStory(page, 'FormAttributes');
    const group = page.getByRole('group', { name: '外部表单视图', exact: true });
    const form = page.locator('#segmented-native-form');
    const canvas = group.getByRole('radio', { name: '画布', exact: true });
    expect(await canvas.evaluate(input => ({ type: (input as HTMLInputElement).type, name: (input as HTMLInputElement).name, form: (input as HTMLInputElement).form?.id, required: (input as HTMLInputElement).required }))).toEqual({ type: 'radio', name: 'view', form: 'segmented-native-form', required: true });
    expect(await form.evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(false);
    expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('view'))).toBeNull();
    await canvas.click(); await page.getByRole('button', { name: '提交视图', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('提交：观山卷宗 · canvas');
    await page.getByRole('button', { name: '原生还原表单', exact: true }).press('Enter');
    await expect(canvas).toBeChecked(); await expect(page.locator('[data-segment-form-owner]')).toHaveText('父模型：canvas · 更新请求：1 次');
    expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('view'))).toBe('canvas');
    // A fresh native activation in the reset task wins over deferred reset work.
    await group.evaluate(element => { const radios = [...element.querySelectorAll<HTMLInputElement>('input')]; radios[0]!.form!.reset(); radios.find(input => input.value === 'archive')!.click(); });
    await expect(group.getByRole('radio', { name: '归档', exact: true })).toBeChecked();
    await expect(page.locator('[data-segment-form-owner]')).toHaveText('父模型：archive · 更新请求：2 次');
    await page.getByRole('button', { name: '清空选择', exact: true }).click(); await expect(group.locator('input:checked')).toHaveCount(0);
    expect(await form.evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(false);
    await page.getByRole('button', { name: '禁用分段', exact: true }).click();
    expect(await group.getByRole('radio').evaluateAll(inputs => inputs.every(input => input.matches(':disabled')))).toBe(true);
    expect(await form.evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(true);
    expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('view'))).toBeNull();
    await page.getByRole('button', { name: '启用分段', exact: true }).click(); await expect(canvas).toBeEnabled();
    await expect(group.getByRole('radio', { name: '审核', exact: true })).toBeDisabled();
    expect(await form.evaluate(element => (element as HTMLFormElement).checkValidity())).toBe(false);
  });
});

test.describe('Segmented on touch displays', () => {
  test.use({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  test('tracks RTL, labels, font metrics and resize without page overflow, then supports both reduced-motion sources and forced colors', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'Responsive', 'theme:dark;motion:standard');
    const group = page.getByRole('group', { name: '随字校准视图', exact: true });
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    expect(await group.locator('.ui-segmented__option').evaluateAll(elements => elements.every(element => element.getBoundingClientRect().height >= 44 && element.getBoundingClientRect().width >= 44))).toBe(true);
    await aligned(group);
    await page.getByRole('button', { name: '切换阅读方向', exact: true }).click();
    await expect.poll(() => group.evaluate(element => getComputedStyle(element).direction)).toBe('rtl');
    await group.getByRole('radio', { name: '归档', exact: true }).press('ArrowRight'); await expect(group.getByRole('radio', { name: '画布', exact: true })).toBeChecked();
    await group.getByRole('radio', { name: '画布', exact: true }).press('ArrowLeft'); await expect(group.getByRole('radio', { name: '归档', exact: true })).toBeChecked(); await aligned(group);
    for (const button of ['切换容器宽度', '切换长标签', '切换字级']) { await page.getByRole('button', { name: button, exact: true }).click(); await aligned(group); await noPageOverflow(page); }
    await expect(group.locator('[data-selected] .ui-segmented__text')).toHaveText('ArchiveWithoutArtificialClipping'.repeat(3));
    await page.setViewportSize({ width: 768, height: 800 }); await aligned(group); await noPageOverflow(page);
    const retired = await group.elementHandle();
    await page.getByRole('button', { name: '卸载分段', exact: true }).click(); await expect(group).toHaveCount(0);
    await page.setViewportSize({ width: 360, height: 800 }); expect(await retired!.evaluate(element => element.isConnected)).toBe(false); await retired!.dispose();
    await page.getByRole('button', { name: '挂载分段', exact: true }).click(); await aligned(group); await noPageOverflow(page);
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, 'Default', `theme:${source === 'system' ? 'dark' : 'light'};motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const reduced = page.getByRole('group', { name: '工作视图', exact: true });
      await reduced.getByRole('radio', { name: '画布', exact: true }).click(); await aligned(reduced);
      expect(await reduced.locator('.ui-segmented__indicator').evaluate(element => getComputedStyle(element).transitionDuration.split(',').every(value => parseFloat(value) === 0))).toBe(true);
      await noPageOverflow(page);
    }
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'no-preference' }); await openStory(page);
    const forced = page.getByRole('group', { name: '工作视图', exact: true }), overview = forced.getByRole('radio', { name: '总览', exact: true });
    expect(await overview.evaluate(element => ({ appearance: getComputedStyle(element).appearance, opacity: getComputedStyle(element).opacity }))).toEqual({ appearance: 'auto', opacity: '1' });
    await expect(forced.locator('.ui-segmented__indicator')).toBeHidden();
    await forced.getByRole('radio', { name: '画布', exact: true }).press('Space'); await expect(forced.getByRole('radio', { name: '画布', exact: true })).toBeChecked(); await noPageOverflow(page);
  });
});
