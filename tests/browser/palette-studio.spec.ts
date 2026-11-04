import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    await use(errors);
    expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});
async function openStudio(page: Page, globals = 'theme:light;palette:paper;motion:standard') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string }[];
  const story = entries.find(entry => entry.type === 'story' && entry.title === '开始/纸墨试色台' && entry.id.endsWith('--default'));
  expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await expect(page.getByRole('heading', { name: '纸上有光，墨中藏锋。', level: 1, exact: true })).toBeVisible();
}
function recentValue(page: Page, label: string) {
  return page.getByRole('region', { name: '最近记录', exact: true }).getByRole('term').filter({ hasText: label }).locator('..').getByRole('definition');
}
function recordCount(page: Page) { return page.getByRole('group', { name: '本页记录', exact: true }).getByRole('definition'); }
async function noOverflow(page: Page) { const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth })); expect(widths.scroll).toBe(widths.viewport); }

test.describe('Paper and pigment studio', () => {
  test('retains inputs and options while changing local palettes and dark mode, and repaints the same paused weave position', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStudio(page);
    const root = page.locator('main.palette-studio'); const name = page.getByRole('textbox', { name: '方案名称', exact: true }); const note = page.getByRole('textbox', { name: '试色备注', exact: true });
    await name.fill('青瓷 · 保留草稿'); await note.fill('留住这一线冷玉与纸面余温。');
    await page.getByRole('switch', { name: '显示材质说明', exact: true }).click();
    await page.getByRole('checkbox', { name: '记录时保留备注', exact: true }).uncheck();
    const slider = page.getByRole('slider', { name: '织光预览进度', exact: true }); await slider.fill('2.4');
    const canvas = page.getByRole('img', { name: '纸墨配色下的经纬织光', exact: true }); const paperImage = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
    const paper = page.getByRole('radio', { name: '宣纸 · 朱砂', exact: true }); await paper.focus(); await page.keyboard.press('ArrowDown');
    const celadon = page.getByRole('radio', { name: '青瓷 · 冷玉', exact: true }); await expect(celadon).toBeChecked(); await expect(celadon).toBeFocused();
    await expect(root).toHaveAttribute('data-ui-theme', 'light'); await expect(root).toHaveAttribute('data-ui-palette', 'celadon');
    await expect(slider).toHaveValue('2.4'); await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).not.toBe(paperImage);
    await page.getByRole('switch', { name: '深色试映', exact: true }).click(); await expect(root).toHaveAttribute('data-ui-theme', 'dark');
    await page.getByRole('radio', { name: '绢素 · 鎏金', exact: true }).check(); await expect(root).toHaveAttribute('data-ui-palette', 'gilt'); await expect(root).toHaveAttribute('data-ui-theme', 'dark');
    await expect(name).toHaveValue('青瓷 · 保留草稿'); await expect(note).toHaveValue('留住这一线冷玉与纸面余温。');
    await expect(page.getByRole('switch', { name: '显示材质说明', exact: true })).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: '记录时保留备注', exact: true })).not.toBeChecked();
    await expect(slider).toHaveValue('2.4'); await expect(page.getByRole('button', { name: '播放织光', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: '公开组件', exact: true }).getByRole('definition')).toHaveText(/41\s*个/);
    await expect(page.getByRole('group', { name: 'Canvas MG', exact: true }).getByRole('definition')).toHaveText(/6\s*套/); await expect(recordCount(page)).toHaveText(/0\s*份/);
  });

  test('records actual local snapshots, announces only the recorded result and restores a cleared draft with owned focus', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStudio(page, 'theme:light;palette:paper;motion:reduced');
    const root = page.locator('main.palette-studio'); const name = page.getByRole('textbox', { name: '方案名称', exact: true }); const note = page.getByRole('textbox', { name: '试色备注', exact: true });
    await name.fill('青瓷 · 验印'); await note.fill('冷玉与朱砂各留一处光。'); await page.getByRole('radio', { name: '青瓷 · 冷玉', exact: true }).check(); await page.getByRole('switch', { name: '深色试映', exact: true }).click();
    const record = page.getByRole('button', { name: '记录并验印', exact: false }); await record.focus(); await page.keyboard.press('Enter');
    await expect(recordCount(page)).toHaveText(/1\s*份/); await expect(recentValue(page, '方案名称')).toHaveText('青瓷 · 验印');
    await expect(recentValue(page, '局部配色')).toHaveText('青瓷 · 冷玉'); await expect(recentValue(page, '纸面模式')).toHaveText('浓墨深色'); await expect(recentValue(page, '留存备注')).toHaveText('冷玉与朱砂各留一处光。');
    await expect(page.getByRole('list', { name: '本页试色记录', exact: true }).getByRole('listitem')).toHaveCount(1); await expect(record).toBeFocused();
    const announcement = page.getByRole('status', { name: '试色方案已记下。', exact: true }); await expect(announcement).toHaveCount(1);
    await expect(announcement).toContainText('第 1 份本页记录：青瓷 · 验印'); await expect(announcement.getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('slider', { name: '织光预览进度', exact: true })).toHaveValue('4.2');
    await name.fill('第二份纸面'); await page.getByRole('checkbox', { name: '记录时保留备注', exact: true }).uncheck(); await page.getByRole('radio', { name: '绢素 · 鎏金', exact: true }).check();
    await record.focus(); await page.keyboard.press('Space'); await expect(recordCount(page)).toHaveText(/2\s*份/); await expect(record).toBeFocused();
    await expect(recentValue(page, '方案名称')).toHaveText('第二份纸面'); await expect(recentValue(page, '留存备注')).toHaveText('未留存备注');
    await expect(page.getByRole('list', { name: '本页试色记录', exact: true }).getByRole('listitem')).toHaveCount(2);
    const reset = page.getByRole('button', { name: '还原试色台', exact: true }); await reset.focus(); await page.keyboard.press('Enter');
    await expect(name).toHaveValue(''); await expect(note).toHaveValue(''); await expect(name).toBeFocused(); await expect(recordCount(page)).toHaveText(/0\s*份/);
    await expect(root).toHaveAttribute('data-ui-theme', 'light'); await expect(root).toHaveAttribute('data-ui-palette', 'paper');
    await expect(page.getByRole('region', { name: '一纸初样，等待记录。', exact: true })).toBeVisible(); await expect(announcement).toHaveCount(0); await expect(reset).toHaveCount(1);
    await record.click(); await expect(name).toBeFocused(); await expect(recordCount(page)).toHaveText(/0\s*份/);
    await note.fill('保留当前编辑焦点'); await reset.evaluate(element => (element as HTMLButtonElement).click());
    await expect(note).toBeFocused(); await expect(note).toHaveValue('');
  });

  test('keeps real playback controllable, maps initial toolbar palettes, and remains usable with long content at 360px and both motion preferences', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStudio(page, 'theme:light;palette:celadon;motion:standard');
    const root = page.locator('main.palette-studio'); const slider = page.getByRole('slider', { name: '织光预览进度', exact: true });
    await expect(root).toHaveAttribute('data-ui-palette', 'celadon'); await expect(slider).toHaveValue('0');
    await page.getByRole('button', { name: '播放织光', exact: true }).click(); await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(.05);
    await page.getByRole('button', { name: '暂停织光', exact: true }).click(); const held = await slider.inputValue(); await page.waitForTimeout(160); await expect(slider).toHaveValue(held);
    await page.getByRole('button', { name: '载入长文样本', exact: true }).click();
    await page.getByRole('button', { name: '记录并验印', exact: false }).click(); await expect(recordCount(page)).toHaveText(/1\s*份/);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(slider).toHaveValue('4.2'); await expect(page.getByRole('button', { name: '查看静态织印', exact: true })).toBeVisible();
    await slider.fill('1.2'); await page.getByRole('radio', { name: '绢素 · 鎏金', exact: true }).check(); await expect(slider).toHaveValue('1.2');
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await expect(slider).toHaveValue('1.2'); await expect(page.getByRole('button', { name: '播放织光', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    for (const [theme, palette, source] of [['light', 'paper', 'container'], ['light', 'celadon', 'system'], ['light', 'gilt', 'container'], ['dark', 'gilt', 'system']] as const) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' }); await openStudio(page, `theme:${theme};palette:${palette};motion:${source === 'container' ? 'reduced' : 'standard'}`);
      await expect(root).toHaveAttribute('data-ui-theme', theme); await expect(root).toHaveAttribute('data-ui-palette', palette);
      await page.getByRole('button', { name: '载入长文样本', exact: true }).click(); await page.getByRole('button', { name: '记录并验印', exact: false }).click();
      await expect(recentValue(page, '方案名称')).toHaveText('ArchivePaletteDraftWithoutArtificialClipping'); await expect(recordCount(page)).toHaveText(/1\s*份/); await expect(slider).toHaveValue('4.2');
      await expect(page.getByRole('status').filter({ hasText: '旋转错层加载演示' })).toHaveCount(1);
      await expect(page.locator('.ui-spinner__assembly')).toHaveCount(1); await expect(page.locator('.ui-spinner__segment')).toHaveCount(4); await expect(page.locator('.ui-spinner__core')).toHaveCount(1);
      const spinnerLayers = page.locator('.ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core'); await expect(spinnerLayers).toHaveCount(6);
      expect(await spinnerLayers.evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none' && getComputedStyle(element).transform === 'none'))).toBe(true);
      expect(await page.locator('.ui-skeleton__line').first().evaluate(element => getComputedStyle(element, '::before').animationName)).toBe('none');
      await noOverflow(page);
      await page.getByRole('button', { name: '聚焦方案名称', exact: true }).click(); await expect(page.getByRole('textbox', { name: '方案名称', exact: true })).toBeFocused();
    }
  });
});
