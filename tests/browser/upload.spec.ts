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
type StoryEntry = { id: string; title: string; type: string; exportName?: string };
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '二级组件/Upload 本地文件' && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `Upload/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}
const payload = (name: string, mimeType = 'text/plain', size = 8) => ({ name, mimeType, buffer: Buffer.alloc(size, 'x') });
async function nativeFiles(picker: Locator) { return picker.evaluate(element => Array.from((element as HTMLInputElement).files ?? []).map(file => ({ name: file.name, size: file.size, type: file.type }))); }
async function nativeNames(picker: Locator) { return (await nativeFiles(picker)).map(file => file.name); }
async function browserFiles(picker: Locator, files: { name: string; type: string; size: number }[]) {
  await picker.evaluate((element, values) => {
    const transfer = new DataTransfer();
    for (const file of values) transfer.items.add(new File([new Uint8Array(file.size)], file.name, { type: file.type, lastModified: 1700000000000 }));
    (element as HTMLInputElement).files = transfer.files;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, files);
}
type DropFile = { name: string; type?: string; text?: string; modified?: number };
async function dispatchFiles(target: Locator, files: DropFile[], type = 'drop') {
  return target.evaluate((element, args) => {
    const transfer = new DataTransfer();
    for (const file of args.files) transfer.items.add(new File([file.text ?? 'drop-data'], file.name, { type: file.type ?? 'text/plain', lastModified: file.modified ?? 1700000000000 }));
    const event = new DragEvent(args.type, { dataTransfer: transfer, bubbles: true, cancelable: true });
    element.dispatchEvent(event); return event.defaultPrevented;
  }, { files, type });
}

test.describe('Local file receiver', () => {
  test('uses one native picker, replaces a single file, preserves cancel and allows removal then reselection without networking', async ({ page }) => {
    await openStory(page); await page.waitForLoadState('networkidle');
    const requests: string[] = []; page.on('request', request => requests.push(`${request.method()} ${request.url()}`));
    const picker = page.getByLabel('归档附件', { exact: true });
    await expect(picker).toHaveAttribute('type', 'file'); await expect(page.locator('input[type=file]')).toHaveCount(1);
    expect(await nativeNames(picker)).toEqual([]);
    await picker.setInputFiles(payload('首次交付.pdf', 'application/pdf', 32));
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：首次交付.pdf');
    expect(await nativeFiles(picker)).toEqual([{ name: '首次交付.pdf', size: 32, type: 'application/pdf' }]);
    await picker.focus(); await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '移除本地文件：首次交付.pdf', exact: true })).toBeFocused();
    await picker.setInputFiles(payload('落印效果.png', 'image/png', 64));
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：落印效果.png');
    await expect(page.getByRole('button', { name: '移除本地文件：首次交付.pdf', exact: true })).toHaveCount(0);
    await picker.dispatchEvent('cancel');
    await expect(page.getByRole('status')).toHaveText('已取消选择，本地文件列表保持不变。');
    expect(await nativeNames(picker)).toEqual(['落印效果.png']);
    await page.getByRole('button', { name: '移除本地文件：落印效果.png', exact: true }).click();
    await expect(picker).toBeFocused(); await expect(page.locator('[data-owner-files]')).toHaveText('父模型：空');
    expect(await nativeNames(picker)).toEqual([]);
    await picker.setInputFiles(payload('落印效果.png', 'image/png', 64));
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：落印效果.png');
    await expect(page.getByText('本地待处理', { exact: true })).toBeVisible();
    expect(requests).toEqual([]);
  });

  test('partially accepts ordered batches and rejects type, size, count and metadata duplicates without corrupting accepted files', async ({ page }) => {
    await openStory(page, 'Limited');
    const picker = page.getByLabel('校验附件', { exact: true });
    // Playwright setInputFiles infers a MIME from the extension when mimeType is
    // empty. Construct real browser Files to exercise genuinely unknown MIME.
    await browserFiles(picker, [{ name: 'wrong.pdf', type: 'application/pdf', size: 8 }, { name: 'large.txt', type: 'text/plain', size: 1025 }, { name: 'empty-mime.txt', type: '', size: 8 }, { name: 'boundary.png', type: 'image/png', size: 1024 }, { name: 'extra.txt', type: 'text/plain', size: 8 }]);
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：empty-mime.txt、boundary.png · 更新请求：1');
    await expect(page.locator('[data-rejections]')).toHaveText('拒绝原因：wrong.pdf:type|large.txt:size|extra.txt:count');
    expect(await nativeFiles(picker)).toEqual([{ name: 'empty-mime.txt', size: 8, type: '' }, { name: 'boundary.png', size: 1024, type: 'image/png' }]);
    expect(await picker.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(true);
    await picker.evaluate(element => {
      const input = element as HTMLInputElement, transfer = new DataTransfer();
      transfer.items.add(input.files![0]!); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('[data-rejections]')).toHaveText('拒绝原因：empty-mime.txt:duplicate');
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：empty-mime.txt、boundary.png · 更新请求：1');
    expect(await nativeNames(picker)).toEqual(['empty-mime.txt', 'boundary.png']);
    // A MIME-only allowlist cannot infer image/png from an empty MIME filename.
    await browserFiles(picker, [{ name: 'unidentified.png', type: '', size: 8 }]);
    await expect(page.locator('[data-rejections]')).toHaveText('拒绝原因：unidentified.png:type');
    expect(await nativeNames(picker)).toEqual(['empty-mime.txt', 'boundary.png']);
  });

  test('restores declined add and remove requests, permits retries and follows programmatic values', async ({ page }) => {
    await openStory(page, 'Controlled');
    const picker = page.getByLabel('受控附件', { exact: true });
    await picker.setInputFiles(payload('request.txt'));
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：initial.txt · 更新请求：1');
    await expect.poll(() => nativeNames(picker)).toEqual(['initial.txt']);
    await picker.setInputFiles(payload('request.txt'));
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：initial.txt · 更新请求：2');
    await expect.poll(() => nativeNames(picker)).toEqual(['initial.txt']);
    const remove = page.getByRole('button', { name: '移除本地文件：initial.txt', exact: true });
    await remove.click(); await expect(remove).toBeFocused();
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：initial.txt · 更新请求：3');
    await page.getByRole('button', { name: '程序替换附件', exact: true }).click();
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：program.txt · 更新请求：3');
    expect(await nativeNames(picker)).toEqual(['program.txt']);
    await page.getByRole('button', { name: '接受后续文件更新', exact: true }).click();
    await picker.setInputFiles(payload('accepted.txt'));
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：accepted.txt · 更新请求：4');
    expect(await nativeNames(picker)).toEqual(['accepted.txt']);
    await page.getByRole('button', { name: '移除本地文件：accepted.txt', exact: true }).click();
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：空 · 更新请求：5'); await expect(picker).toBeFocused();
    // An invalid owner may repeat the same File object. Correcting its second
    // occurrence must restore focus when that occurrence's DOM button is gone.
    await page.getByRole('button', { name: '程序设置重复父值', exact: true }).click();
    const duplicates = page.getByRole('button', { name: '移除本地文件：duplicate.txt', exact: true });
    await expect(duplicates).toHaveCount(2);
    expect(await picker.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(false);
    await duplicates.nth(1).focus(); await duplicates.nth(1).press('Enter');
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：duplicate.txt · 更新请求：6');
    await expect(duplicates).toHaveCount(1); await expect(duplicates.first()).toBeFocused();
    expect(await nativeNames(picker)).toEqual(['duplicate.txt']);
    expect(await picker.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(true);
  });

  test('validates a focusable native required input and submits real Files through external forms, readonly, disabled and reset', async ({ page }) => {
    await openStory(page, 'FormAttributes');
    const picker = page.getByLabel('必填附件', { exact: true });
    const proof = page.getByLabel('只读证明附件', { exact: true });
    const excluded = page.getByLabel('禁用证明附件', { exact: true });
    const submit = page.getByRole('button', { name: '提交本地附件', exact: true });
    await submit.click(); await expect(picker).toBeFocused();
    await expect(page.locator('[data-form-result]')).toHaveText('尚未提交');
    expect(await picker.evaluate(element => (element as HTMLInputElement).validity.valueMissing)).toBe(true);
    expect(await picker.evaluate(element => { const input = element as HTMLInputElement; return { required: input.required, width: input.getBoundingClientRect().width, height: input.getBoundingClientRect().height, display: getComputedStyle(input).display }; })).toMatchObject({ required: true });
    await picker.setInputFiles([payload('one.txt', 'text/plain', 7), payload('two.txt', 'text/plain', 9)]);
    expect(await proof.evaluate(element => (element as HTMLInputElement).disabled)).toBe(false);
    await expect(excluded).toBeDisabled();
    await submit.click();
    await expect(page.locator('[data-form-result]')).toContainText('"attachments",{"name":"one.txt","size":7,"type":"text/plain"}');
    await expect(page.locator('[data-form-result]')).toContainText('"proof",{"name":"proof.txt"');
    await expect(page.locator('[data-form-result]')).not.toContainText('excluded');
    const formFiles = () => page.locator('form').evaluate(form => [...new FormData(form as HTMLFormElement)].map(([name, value]) => ({ field: name, file: value instanceof File, name: value instanceof File ? value.name : String(value), size: value instanceof File ? value.size : -1 })));
    expect(await formFiles()).toEqual([{ field: 'attachments', file: true, name: 'one.txt', size: 7 }, { field: 'attachments', file: true, name: 'two.txt', size: 9 }, { field: 'proof', file: true, name: 'proof.txt', size: new TextEncoder().encode('本地交付资料').length }]);
    await page.getByRole('button', { name: '设为只读附件', exact: true }).click();
    await expect(picker).toHaveAttribute('tabindex', '-1'); await expect(picker).not.toHaveAttribute('required');
    const receiver = page.locator('.ui-upload').filter({ has: picker }).locator('.ui-upload__receiver');
    await dispatchFiles(receiver, [{ name: 'blocked.txt' }]);
    expect(await nativeNames(picker)).toEqual(['one.txt', 'two.txt']);
    await picker.setInputFiles(payload('blocked.txt'));
    await expect.poll(() => nativeNames(picker)).toEqual(['one.txt', 'two.txt']);
    expect(await picker.evaluate(element => !element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))).toBe(true);
    await expect(page.getByRole('button', { name: '移除本地文件：one.txt', exact: true })).toBeDisabled();
    expect((await formFiles()).filter(entry => entry.field === 'attachments')).toHaveLength(2);
    await page.getByRole('button', { name: '允许修改附件', exact: true }).click();
    await page.getByRole('button', { name: '禁用附件控件', exact: true }).click();
    await expect(picker).toBeDisabled(); expect((await formFiles()).map(entry => entry.field)).toEqual(['proof']);
    await page.getByRole('button', { name: '启用附件控件', exact: true }).click();
    await page.getByRole('button', { name: '重置本地附件', exact: true }).click();
    await expect(page.locator('[data-owner-files]')).toHaveText('父模型：空');
    await expect.poll(() => nativeNames(picker)).toEqual([]); await expect.poll(() => nativeNames(proof)).toEqual(['proof.txt']);
    expect(await picker.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(false);
    await page.locator('form').evaluate(element => { const form = element as HTMLFormElement; form.reset(); form.reset(); });
    await expect.poll(() => nativeNames(proof)).toEqual(['proof.txt']);
    expect((await formFiles()).find(entry => entry.field === 'proof')).toMatchObject({ file: true, name: 'proof.txt' });
  });

  test('scopes file dragging locally, restores removal focus and cleans reset listeners while an instance is unmounted', async ({ page }) => {
    await openStory(page, 'Multiple');
    const picker = page.getByLabel('追加附件', { exact: true }); const receiver = page.locator('.ui-upload__receiver');
    const dropped = [{ name: 'dropped.txt', text: 'from drop' }];
    expect(await dispatchFiles(receiver, dropped, 'dragenter')).toBe(true); await expect(receiver).toHaveAttribute('data-dragging', 'true');
    await dispatchFiles(receiver.locator('.ui-upload__slot'), dropped, 'dragenter');
    await dispatchFiles(receiver.locator('.ui-upload__slot'), dropped, 'dragleave'); await expect(receiver).toHaveAttribute('data-dragging', 'true');
    expect(await dispatchFiles(receiver, dropped)).toBe(true); await expect(receiver).not.toHaveAttribute('data-dragging');
    await expect.poll(() => nativeNames(picker)).toEqual(['墨迹说明.txt', '落印图.png', 'dropped.txt']);
    // No component listener is installed on the page's unrelated drop targets.
    expect(await dispatchFiles(page.locator('body'), [{ name: 'outside.txt' }], 'dragover')).toBe(false);
    expect(await dispatchFiles(page.locator('body'), [{ name: 'outside.txt' }])).toBe(false);
    const first = page.getByRole('button', { name: '移除本地文件：墨迹说明.txt', exact: true });
    await first.focus(); await first.press('Enter');
    await expect(page.getByRole('button', { name: '移除本地文件：落印图.png', exact: true })).toBeFocused();
    await page.getByRole('button', { name: '移除本地文件：dropped.txt', exact: true }).click();
    await expect(page.getByRole('button', { name: '移除本地文件：落印图.png', exact: true })).toBeFocused();

    await openStory(page, 'UnmountCleanup'); const cleanupPicker = page.getByLabel('可卸载附件', { exact: true });
    const oldId = await cleanupPicker.getAttribute('id');
    await page.getByRole('button', { name: '原生重置草稿', exact: true }).click();
    await expect.poll(() => nativeNames(cleanupPicker)).toEqual(['保留的草稿.txt']);
    await cleanupPicker.evaluate(element => {
      const input = element as HTMLInputElement;
      input.form!.reset(); input.form!.reset();
      const transfer = new DataTransfer(); transfer.items.add(new File(['new'], 'post-reset.txt', { type: 'text/plain', lastModified: 1700000000000 }));
      input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect.poll(() => nativeNames(cleanupPicker)).toEqual(['保留的草稿.txt', 'post-reset.txt']);
    await dispatchFiles(page.locator('.ui-upload__receiver'), dropped, 'dragenter');
    await page.getByRole('button', { name: '卸载文件组件', exact: true }).evaluate(element => {
      element.closest('main')!.querySelector('form')!.reset();
      (element as HTMLButtonElement).click();
    });
    await expect(cleanupPicker).toHaveCount(0);
    await page.getByRole('button', { name: '原生重置草稿', exact: true }).click();
    await page.getByRole('button', { name: '重新挂载文件组件', exact: true }).click();
    expect(await cleanupPicker.getAttribute('id')).not.toBe(oldId);
    await expect.poll(() => nativeNames(cleanupPicker)).toEqual(['保留的草稿.txt', 'post-reset.txt']);
    await expect(page.locator('.ui-upload__receiver')).not.toHaveAttribute('data-dragging');
    await cleanupPicker.setInputFiles(payload('remounted.txt'));
    await expect.poll(() => nativeNames(cleanupPicker)).toEqual(['保留的草稿.txt', 'post-reset.txt', 'remounted.txt']);
  });

  test('wraps long filenames at 360px in both themes and supports coarse controls, both reduced motion sources and forced colors', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
    const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      for (const scenario of [{ theme: 'light', source: 'container' }, { theme: 'dark', source: 'system' }]) {
        await page.emulateMedia({ reducedMotion: scenario.source === 'system' ? 'reduce' : 'no-preference' });
        await openStory(page, 'LongContent', `theme:${scenario.theme};motion:${scenario.source === 'container' ? 'reduced' : 'standard'}`);
        const picker = page.getByLabel('长文件附件', { exact: true }); const receiver = page.locator('.ui-upload__receiver');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
        const remove = page.locator('.ui-upload__remove').first(); const buttonBox = await remove.boundingBox(); expect(buttonBox!.width).toBeGreaterThanOrEqual(44); expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
        const pickerBox = await picker.boundingBox(); expect(pickerBox!.width).toBeGreaterThanOrEqual(44); expect(pickerBox!.height).toBeGreaterThanOrEqual(44);
        const names = await page.locator('.ui-upload__filename').evaluateAll(elements => elements.map(element => ({ scroll: element.scrollWidth, client: element.clientWidth, height: element.getBoundingClientRect().height })));
        expect(names.every(item => item.scroll <= item.client)).toBe(true); expect(names[0]!.height).toBeGreaterThan(30);
        expect(await page.locator('.ui-upload__rail').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
        expect(await remove.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
        await picker.focus(); expect(await receiver.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
      }
      await page.emulateMedia({ forcedColors: 'active' });
      expect(await page.locator('.ui-upload__receiver').evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
      expect(await page.locator('.ui-upload__receiver').evaluate(element => getComputedStyle(element, '::before').display)).toBe('none');
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
