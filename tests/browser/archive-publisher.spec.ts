import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); }); await use(errors); expect(errors).toEqual([]); }, { auto: true }],
});
const publisherTitle = '开始/档案发布台', coverageTitle = '开始/组件覆盖对照';
const coverageCaption = 'MaLang 与 Ant Design / Element Plus 能力覆盖对照';
async function openStory(page: Page, title = publisherTitle, globals = 'theme:light;palette:paper;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string }[];
  const story = entries.find(item => item.type === 'story' && item.title === title && item.id.endsWith('--default')); expect(story).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
  await expect(page.getByRole('heading', { name: title === publisherTitle ? '作品入册，核验成章。' : '补齐常用，再逐层深入。', exact: true })).toBeVisible();
}
async function clockPublisher(page: Page) { await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') }); await openStory(page); await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z')); }
const collection = (page: Page) => page.getByRole('region', { name: '档案列表', exact: true });
const filters = (page: Page) => page.getByRole('group', { name: '筛选档案', exact: true });
const message = (page: Page, content: string) => page.getByRole('region', { name: '全局提示', exact: true }).getByRole('group', { name: content, exact: true });
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true); }
async function withinViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox(), width = await page.evaluate(() => document.documentElement.clientWidth);
  expect(box).not.toBeNull(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(width + .5);
}

test.describe('Archive publisher integration', () => {
  test('rejects empty and duplicate drafts, registers a unique record, previews its gallery and archives actual list state', async ({ page }) => {
    await clockPublisher(page);
    const form = page.getByRole('form', { name: '作品登记', exact: true }), submit = form.getByRole('button', { name: '核对并登记档案', exact: true });
    const name = form.getByRole('textbox', { name: '作品名称', exact: true }), code = form.getByRole('textbox', { name: '档案代号', exact: true }), note = form.getByRole('textbox', { name: '作品说明', exact: true });
    await expect(collection(page).getByRole('article')).toHaveCount(1);
    await submit.click(); await expect(name).toBeFocused(); await expect(name).toHaveAttribute('aria-invalid', 'true');
    const summary = form.getByRole('region', { name: '表单校验结果', exact: true }); await expect(summary.getByRole('button')).toHaveCount(2);
    await expect(summary.getByRole('button', { name: '作品名称：请填写作品名称。', exact: true })).toBeVisible();
    await expect(summary.getByRole('button', { name: '档案代号：请填写档案代号。', exact: true })).toBeVisible();
    const title = '青玉机关 · 校对稿'; await name.fill(title); await code.fill('ink-gate'); await note.fill('保留来源与修订说明。');
    await submit.click(); await expect(form).toHaveAttribute('aria-busy', 'true'); await page.clock.runFor(379); await expect(collection(page).getByRole('article')).toHaveCount(1);
    await page.clock.runFor(1); await expect(code).toBeFocused(); await expect(code).toHaveAttribute('aria-invalid', 'true');
    await expect(summary.getByRole('button', { name: '档案代号：此代号已存在，请换一个。', exact: true })).toBeVisible();
    await code.fill('jade-study-02'); await submit.click(); await expect(form).toHaveAttribute('aria-busy', 'true'); await page.clock.runFor(380);
    await expect(summary).toHaveCount(0); await expect(collection(page).getByRole('article')).toHaveCount(2);
    const record = collection(page).getByRole('article', { name: title, exact: true }); await expect(record).toBeVisible(); await expect(record.getByText('jade-study-02', { exact: true })).toBeVisible();
    await expect(message(page, '新档案已登记，可预览并确认归档。')).toBeVisible();
    expect(await form.evaluate(element => Object.fromEntries(new FormData(element as HTMLFormElement)))).toEqual({ title, code: 'jade-study-02', note: '保留来源与修订说明。' });

    const preview = record.getByRole('button', { name: `预览图片：${title}，原创水墨机械插图`, exact: true }); await expect(preview).toBeEnabled(); await preview.focus(); await preview.press('Enter');
    const image = page.getByRole('dialog', { name: '图片预览', exact: true }); await expect(image).toBeVisible(); await expect(image.getByRole('status')).toHaveText('2 / 3');
    await page.keyboard.press('ArrowRight'); await expect(image.getByRole('status')).toHaveText('3 / 3');
    await expect(image.getByRole('img', { name: '图片组第 3 张', exact: true })).toBeVisible();
    const zoom = image.getByRole('button', { name: '放大图片', exact: true }); await expect(zoom).toBeEnabled(); await zoom.click(); await zoom.click();
    await expect(image.getByRole('button', { name: '还原 150%', exact: true })).toBeEnabled();
    expect(await image.getByRole('region', { name: '大图浏览区域', exact: true }).evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await image.getByRole('button', { name: '关闭图片预览', exact: true }).click(); await expect(image).toBeHidden(); await expect(preview).toBeFocused();
    await filters(page).getByRole('radio', { name: '已归档', exact: true }).check(); await expect(collection(page).getByRole('article')).toHaveCount(0); await expect(collection(page).getByRole('heading', { name: '此处尚无档案', exact: true })).toBeVisible();
    await filters(page).getByRole('radio', { name: '待归档', exact: true }).check(); await expect(collection(page).getByRole('article')).toHaveCount(2);
    await filters(page).getByRole('radio', { name: '全部档案', exact: true }).check();
    await record.getByRole('button', { name: `归档${title}`, exact: true }).click(); const confirm = page.getByRole('dialog', { name: `确认归档「${title}」？`, exact: true });
    await expect(confirm).toBeVisible(); await confirm.getByRole('button', { name: '确认归档', exact: true }).click(); await page.clock.runFor(379);
    await expect(record.getByText('待归档', { exact: true })).toBeVisible(); await expect(confirm.getByRole('button', { name: '确认归档', exact: true })).toBeDisabled();
    await page.clock.runFor(1); await expect(confirm).toHaveCount(0); await expect(record.getByText('已归档', { exact: true })).toBeVisible(); await expect(record.getByRole('button', { name: `归档${title}`, exact: true })).toHaveCount(0);
    await expect(message(page, `「${title}」已归档。`)).toBeVisible();
    await filters(page).getByRole('radio', { name: '已归档', exact: true }).check(); await expect(collection(page).getByRole('article')).toHaveCount(1); await expect(record).toBeVisible();
    await expect(name).toHaveValue(title); await expect(code).toHaveValue('jade-study-02'); await expect(note).toHaveValue('保留来源与修订说明。');
  });

  test('cancels async archiving without a late write and restores a filtered-out row focus while keeping the unsaved draft', async ({ page }) => {
    await clockPublisher(page);
    const form = page.getByRole('form', { name: '作品登记', exact: true }), name = form.getByRole('textbox', { name: '作品名称', exact: true }), code = form.getByRole('textbox', { name: '档案代号', exact: true }), note = form.getByRole('textbox', { name: '作品说明', exact: true });
    await name.fill('仍在编辑的新作品'); await code.fill('draft-kept'); await note.fill('尚未提交，不随归档操作清空。');
    const draft = filters(page).getByRole('radio', { name: '待归档', exact: true }); await draft.check();
    const title = '墨关 · 机械山水', record = collection(page).getByRole('article', { name: title, exact: true }), trigger = record.getByRole('button', { name: `归档${title}`, exact: true });
    const confirm = page.getByRole('dialog', { name: `确认归档「${title}」？`, exact: true });
    await trigger.focus(); await trigger.press('Enter'); await expect(confirm.getByRole('button', { name: '取消', exact: true })).toBeFocused();
    await confirm.getByRole('button', { name: '确认归档', exact: true }).click(); await page.clock.runFor(200); await page.keyboard.press('Escape'); await expect(confirm).toBeHidden(); await expect(trigger).toBeFocused();
    await page.clock.runFor(1000); await expect(record.getByText('待归档', { exact: true })).toBeVisible(); await expect(record.getByText('已归档', { exact: true })).toHaveCount(0); await expect(message(page, `「${title}」已归档。`)).toHaveCount(0);
    await trigger.click(); await confirm.getByRole('button', { name: '确认归档', exact: true }).click(); await name.focus(); await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden(); await expect(name).toBeFocused(); await page.clock.runFor(1000); await expect(record.getByText('待归档', { exact: true })).toBeVisible();
    await trigger.focus(); await trigger.press('Enter'); await confirm.getByRole('button', { name: '确认归档', exact: true }).click(); await page.clock.runFor(380);
    await expect(record).toHaveCount(0); await expect(draft).toBeChecked(); await expect(draft).toBeFocused(); await expect(collection(page).getByRole('heading', { name: '此处尚无档案', exact: true })).toBeVisible();
    await expect(message(page, `「${title}」已归档。`)).toBeVisible();
    await expect(name).toHaveValue('仍在编辑的新作品'); await expect(code).toHaveValue('draft-kept'); await expect(note).toHaveValue('尚未提交，不随归档操作清空。');
    await filters(page).getByRole('radio', { name: '已归档', exact: true }).check(); await expect(record).toBeVisible(); await expect(record.getByText('已归档', { exact: true })).toBeVisible(); await expect(collection(page).getByRole('article')).toHaveCount(1);
  });
});

test.describe('Coverage directory and narrow archive layouts', () => {
  test.use({ viewport: { width: 360, height: 760 }, hasTouch: true, isMobile: true });
  test('searches all 29 capabilities and 73/82 reference entries and keeps both workbenches usable in four materials', async ({ page }) => {
    await openStory(page, coverageTitle);
    const count = page.getByRole('status'), table = page.getByRole('table', { name: coverageCaption, exact: true });
    const query = page.getByRole('searchbox', { name: '搜索能力或组件', exact: true }), state = page.getByRole('combobox', { name: '覆盖状态', exact: true });
    await expect(count).toHaveText('显示 29 / 29 项能力'); await expect(table.getByRole('row')).toHaveCount(30);
    const ant = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: /^Ant Design/ }) }), element = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: /^Element Plus/ }) });
    await ant.locator('summary').click(); await expect(ant.getByRole('listitem')).toHaveCount(73); await expect(ant.locator('summary')).toContainText('73 / 73 项');
    await element.locator('summary').click(); await expect(element.getByRole('listitem')).toHaveCount(82); await expect(element.locator('summary')).toContainText('82 / 82 项');
    await query.fill('Masonry'); await expect(count).toHaveText('显示 1 / 29 项能力'); await expect(table.getByRole('row')).toHaveCount(2); await expect(table.getByText('栅格、页面布局与分栏', { exact: true })).toBeVisible(); await expect(table.getByText('后续规划', { exact: true })).toBeVisible(); await expect(ant.getByText('Masonry', { exact: true })).toBeVisible();
    await query.fill('InputTag'); await expect(count).toHaveText('显示 1 / 29 项能力'); await expect(element.getByText('Input Tag', { exact: true })).toBeVisible(); await expect(table.getByText('后续规划', { exact: true })).toBeVisible();
    for (const component of ['MSegmented', 'MPopconfirm', 'MImage', 'MFormItem']) {
      await query.fill(component); await expect(count).toHaveText('显示 1 / 29 项能力'); await expect(table.getByRole('row')).toHaveCount(2); await expect(table.getByText(component, { exact: true })).toBeVisible(); await expect(table.getByText('本轮补齐', { exact: true })).toBeVisible();
    }
    await query.fill('Masonry'); await state.selectOption('added'); await expect(count).toHaveText('显示 0 / 29 项能力'); await expect(table.getByRole('heading', { name: '暂无数据', exact: true })).toBeVisible();
    await expect(ant.getByRole('listitem')).toHaveCount(0); await expect(element.getByRole('listitem')).toHaveCount(0); await expect(ant.getByText('没有匹配的目录条目。', { exact: true })).toBeVisible(); await expect(element.getByText('没有匹配的目录条目。', { exact: true })).toBeVisible();
    const backgrounds: string[] = [];
    for (const profile of ['theme:light;palette:paper', 'theme:light;palette:celadon', 'theme:light;palette:gilt', 'theme:dark;palette:paper']) {
      await openStory(page, coverageTitle, `${profile};motion:reduced`); await expect(count).toHaveText('显示 29 / 29 项能力'); await noOverflow(page);
      backgrounds.push(await page.locator('.kit-story-surface').evaluate(element => getComputedStyle(element).backgroundColor));
      const region = page.getByRole('region', { name: coverageCaption, exact: true }); await withinViewport(page, region); await withinViewport(page, query); await withinViewport(page, state);
      expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true); await region.evaluate(element => element.scrollTo({ left: element.scrollWidth, behavior: 'instant' })); expect(await region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await query.fill('MPopconfirm'); await expect(count).toHaveText('显示 1 / 29 项能力'); await noOverflow(page);
      await openStory(page, publisherTitle, `${profile};motion:reduced`); await noOverflow(page); await withinViewport(page, page.getByRole('form', { name: '作品登记', exact: true })); await withinViewport(page, collection(page)); await withinViewport(page, filters(page));
      const record = collection(page).getByRole('article', { name: '墨关 · 机械山水', exact: true }); await withinViewport(page, record);
      const preview = record.getByRole('button', { name: '预览图片：墨关 · 机械山水，原创水墨机械插图', exact: true }); await expect(preview).toBeEnabled(); const previewBox = await preview.boundingBox(); expect(previewBox!.height).toBeGreaterThanOrEqual(44);
      await record.getByRole('button', { name: '归档墨关 · 机械山水', exact: true }).click(); const confirm = page.getByRole('dialog', { name: '确认归档「墨关 · 机械山水」？', exact: true }); await expect(confirm).toBeVisible(); await withinViewport(page, confirm);
      for (const button of await confirm.getByRole('button').all()) { const bounds = await button.boundingBox(); expect(bounds!.width).toBeGreaterThanOrEqual(44); expect(bounds!.height).toBeGreaterThanOrEqual(44); }
      await confirm.getByRole('button', { name: '取消', exact: true }).click(); await expect(confirm).toBeHidden(); await noOverflow(page);
    }
    expect(new Set(backgrounds).size).toBe(4);
  });
});
