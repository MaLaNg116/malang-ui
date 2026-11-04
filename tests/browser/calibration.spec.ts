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
const numberTitle = '二级组件/InputNumber 数字输入';
const sliderTitle = '二级组件/Slider 刻度滑轨';
async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === title && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function expectNoOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}
async function expectDescriptions(page: Page, control: Locator) {
  const ids = (await control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  expect(ids.length).toBeGreaterThan(0); expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
}

test.describe('Numeric calibration', () => {
  test('steps decimals without drift, honors native arrows and keeps empty or incomplete editing numeric-safe', async ({ page }) => {
    await openStory(page, numberTitle, 'Decimal');
    const number = page.getByRole('spinbutton', { name: '步进幅度', exact: true });
    const increase = page.getByRole('button', { name: '增加步进幅度', exact: true });
    const decrease = page.getByRole('button', { name: '减少步进幅度', exact: true });
    await expect(number).toHaveValue('0.2');
    await increase.click(); await expect(number).toHaveValue('0.3');
    await expect(page.getByText('父模型：0.3', { exact: true })).toBeVisible();
    for (let index = 0; index < 7; index++) await increase.click();
    await expect(number).toHaveValue('1'); await expect(increase).toBeDisabled();
    await decrease.focus(); await page.keyboard.press('Enter'); await expect(number).toHaveValue('0.9');
    await number.focus(); await page.keyboard.press('ArrowDown'); await expect(number).toHaveValue('0.8');

    await number.fill('2');
    await expect(page.getByText('父模型：1', { exact: true })).toBeVisible();
    await number.press('Tab'); await expect(number).toHaveValue('1');
    await number.fill(''); await expect(page.getByText('父模型：未设置', { exact: true })).toBeVisible();
    await number.pressSequentially('1e');
    expect(await number.evaluate(element => (element as HTMLInputElement).validity.badInput)).toBe(true);
    await expect(page.getByText('父模型：1', { exact: true })).toBeVisible();
    await expect(page.getByText(/NaN|Infinity/)).toHaveCount(0);
    await number.press('Tab'); await expect(number).toHaveValue('1');
    await expectDescriptions(page, number);
  });

  test('lets a controlled owner decline and retry requests while composition survives a parent hint update', async ({ page }) => {
    await openStory(page, numberTitle, 'Controlled');
    const number = page.getByRole('spinbutton', { name: '受控强度', exact: true });
    const increase = page.getByRole('button', { name: '增加受控强度', exact: true });
    await increase.click(); await expect(number).toHaveValue('1.2');
    await expect(page.getByRole('status')).toHaveText('更新请求：1 次 · 父模型：1.2');
    await increase.click(); await expect(number).toHaveValue('1.2');
    await expect(page.getByRole('status')).toHaveText('更新请求：2 次 · 父模型：1.2');
    await page.getByRole('button', { name: '接受更新', exact: true }).click();
    await number.focus();
    await number.evaluate(element => {
      element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      (element as HTMLInputElement).value = '0.8';
      element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '0.8', isComposing: true }));
    });
    await expect(page.getByText('原生input已触发；父页面的帮助文字更新不应打断组合草稿。', { exact: true })).toBeVisible();
    await expect(number).toHaveValue('0.8');
    await expect(page.getByRole('status')).toHaveText('更新请求：2 次 · 父模型：1.2');
    await number.evaluate(element => {
      element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '0.8' }));
      element.dispatchEvent(new InputEvent('input', { bubbles: true, data: '0.8', isComposing: false }));
    });
    await expect(page.getByRole('status')).toHaveText('更新请求：3 次 · 父模型：0.8');
    await expect(number).toHaveValue('0.8');
  });

  test('preserves native required validation, form data and dynamic readonly or disabled states', async ({ page }) => {
    await openStory(page, numberTitle, 'FormAttributes');
    const number = page.getByRole('spinbutton', { name: '检查时长', exact: true });
    const slider = page.getByRole('slider', { name: '检查进度', exact: true });
    const submit = page.getByRole('button', { name: '提交校准', exact: true });
    await expect(number).toHaveAttribute('name', 'duration'); await expect(number).toHaveAttribute('autocomplete', 'off');
    await expect(number).toHaveAttribute('required', ''); await submit.click();
    expect(await number.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
    await expect(number).toBeFocused(); await expect(page.getByRole('status')).toHaveText('尚未提交');
    await number.fill('1.5'); await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue('100');
    await submit.click(); await expect(page.getByRole('status')).toHaveText('提交数值：1.5；滑轨：100');

    await page.getByRole('button', { name: '设为只读', exact: true }).click();
    await expect(number).not.toBeEditable();
    await expect(page.getByRole('button', { name: '减少检查时长', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: '增加检查时长', exact: true })).toBeDisabled();
    await number.focus(); await page.keyboard.press('ArrowUp'); await expect(number).toHaveValue('1.5');
    await page.getByRole('button', { name: '禁用控件', exact: true }).click();
    await expect(number).toBeDisabled(); await expect(slider).toBeDisabled(); await submit.click();
    await expect(page.getByRole('status')).toHaveText('提交数值：未提交；滑轨：未提交');
    await page.getByRole('button', { name: '启用控件', exact: true }).click();
    await page.getByRole('button', { name: '允许编辑', exact: true }).click();
    await expect(number).toBeEditable(); await expect(number).toHaveValue('1.5'); await expect(slider).toHaveValue('100');
  });

  test('keeps native slider keyboard behavior and changes only display when its owner or limits do not accept a value', async ({ page }) => {
    await openStory(page, sliderTitle);
    const slider = page.getByRole('slider', { name: '机关行程', exact: true });
    await slider.focus(); await page.keyboard.press('ArrowRight'); await expect(slider).toHaveValue('40');
    await expect(page.getByText('父模型：40', { exact: true })).toBeVisible();
    await page.keyboard.press('Home'); await expect(slider).toHaveValue('0');
    await page.keyboard.press('End'); await expect(slider).toHaveValue('100');

    await openStory(page, sliderTitle, 'Controlled');
    const controlled = page.getByRole('slider', { name: '受控滑轨', exact: true });
    await controlled.focus(); await page.keyboard.press('ArrowRight'); await expect(controlled).toHaveValue('30');
    await expect(page.getByRole('status')).toHaveText('更新请求：1 次 · 父模型：30');
    await page.keyboard.press('ArrowRight'); await expect(controlled).toHaveValue('30');
    await expect(page.getByRole('status')).toHaveText('更新请求：2 次 · 父模型：30');
    await page.getByRole('button', { name: '接受更新', exact: true }).click();
    await controlled.focus(); await page.keyboard.press('ArrowRight'); await expect(controlled).toHaveValue('35');
    await expect(page.getByRole('status')).toHaveText('更新请求：3 次 · 父模型：35');

    await openStory(page, sliderTitle, 'ChangingBounds');
    const changing = page.getByRole('slider', { name: '动态范围', exact: true });
    await expect(changing).toHaveValue('40'); await expect(page.getByRole('status')).toHaveText('父模型：80 · 更新请求：0 次');
    await page.getByRole('button', { name: '切换范围', exact: true }).click();
    await expect(changing).toHaveValue('80'); await expect(page.getByRole('status')).toHaveText('父模型：80 · 更新请求：0 次');
    await changing.focus(); await page.keyboard.press('ArrowRight'); await expect(changing).toHaveValue('85');
    await expect(page.getByRole('status')).toHaveText('父模型：85 · 更新请求：1 次');

    await openStory(page, sliderTitle, 'Fractional');
    const fractional = page.getByRole('slider', { name: '节奏倍率', exact: true });
    await expect(fractional).toHaveValue('1.2'); await fractional.focus();
    await page.keyboard.press('Home'); await expect(fractional).toHaveValue('0.6');
    await page.keyboard.press('End'); await expect(fractional).toHaveValue('1.8');
  });
});

test.describe('Calibration on touch displays', () => {
  test.use({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  test('keeps touch targets, error descriptions and long labels usable with either reduced-motion source and forced colors', async ({ page }) => {
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      const globals = `theme:${source === 'container' ? 'light' : 'dark'};motion:${source === 'container' ? 'reduced' : 'standard'}`;
      await openStory(page, numberTitle, 'Error', globals);
      const number = page.getByRole('spinbutton', { name: '校准强度', exact: true });
      await expect(number).toHaveAttribute('aria-invalid', 'true'); await expectDescriptions(page, number);
      await expect(page.getByRole('alert')).toHaveText('当前强度超出本次任务允许范围。');
      expect((await number.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      for (const button of await page.getByRole('button').all()) {
        const box = (await button.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
        expect(await button.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
      }
      await expectNoOverflow(page);
      await openStory(page, sliderTitle, 'Error', globals);
      const error = page.getByRole('slider', { name: '机关行程', exact: true });
      await expect(error).toHaveAttribute('aria-invalid', 'true'); await expectDescriptions(page, error);
      await expect(page.getByRole('alert')).toHaveText('当前档位无法用于此项任务。');
      await openStory(page, sliderTitle, 'LongLabel', globals);
      const slider = page.getByRole('slider'); expect((await slider.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await slider.focus(); await page.keyboard.press('End'); await expect(slider).toHaveValue('100');
      await expectNoOverflow(page);
    }
    await page.emulateMedia({ forcedColors: 'active' });
    expect(await page.locator('.ui-slider__rail').evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
  });
});
