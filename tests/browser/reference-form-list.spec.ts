import { test, expect } from '@playwright/test';
test('nested and dynamic fields validate exact paths, preserve row identity, and submit repeated native values', async ({ page }) => {
  const data = await (await page.request.get('/index.json')).json();
  const entry = (Object.values(data.entries) as { id: string; title: string }[]).find(item => item.title === '基础组件/Form 动态字段' && item.id.endsWith('--default')); expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=theme:light;motion:reduced`); await page.locator('#storybook-root .kit-story-surface').waitFor();
  await page.getByRole('button', { name: '提交动态表单', exact: true }).click(); await expect(page.getByRole('textbox', { name: '档案名', exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('textbox', { name: '档案名', exact: true }).fill('墨浪库'); await page.getByRole('textbox', { name: '成员1', exact: true }).fill('观山');
  await page.getByRole('button', { name: '添加成员', exact: true }).click(); await page.getByRole('textbox', { name: '成员2', exact: true }).fill('听雨');
  await page.getByRole('button', { name: '上移成员2', exact: true }).click(); await expect(page.getByRole('textbox', { name: '成员1', exact: true })).toHaveValue('听雨');
  await page.getByRole('button', { name: '删除成员2', exact: true }).click(); await expect(page.getByRole('textbox', { name: '成员2', exact: true })).toHaveCount(0);
  await page.getByRole('listbox', { name: '原生多选材质', exact: true }).selectOption(['paper', 'ink']);
  await page.getByRole('checkbox', { name: '浓墨', exact: true }).check(); await expect(page.getByRole('checkbox', { name: '青玉', exact: true })).toBeDisabled();
  const form = page.getByRole('form', { name: '档案成员', exact: true }); expect(await form.evaluate((el: HTMLFormElement) => new FormData(el).getAll('materials'))).toEqual(['paper', 'ink']); expect(await form.evaluate((el: HTMLFormElement) => new FormData(el).getAll('checked'))).toEqual(['paper', 'ink']);
  await page.getByRole('button', { name: '提交动态表单', exact: true }).click(); await expect(page.locator('output')).toContainText('听雨'); await expect(page.locator('output')).not.toContainText('观山');
});

test('moving dynamic rows clears the previous path errors and validates their new positions', async ({ page }) => {
  const data = await (await page.request.get('/index.json')).json();
  const entry = (Object.values(data.entries) as { id: string; title: string }[]).find(item => item.title === '基础组件/Form 动态字段' && item.id.endsWith('--default'));
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=motion:reduced`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
  await page.getByRole('textbox', { name: '档案名', exact: true }).fill('墨浪库');
  await page.getByRole('textbox', { name: '成员1', exact: true }).fill('有效成员');
  await page.getByRole('button', { name: '添加成员', exact: true }).click();
  await page.getByRole('button', { name: '提交动态表单', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '成员2', exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: '上移成员2', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '成员1', exact: true })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: '成员2', exact: true })).toHaveValue('有效成员');
  await expect(page.locator('.ui-form-item[data-invalid]')).toHaveCount(0);
  await page.getByRole('button', { name: '提交动态表单', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '成员1', exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('textbox', { name: '成员2', exact: true })).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: '删除成员1', exact: true }).click();
  await expect(page.locator('.ui-form-item[data-invalid]')).toHaveCount(0);
  await page.getByRole('button', { name: '提交动态表单', exact: true }).click();
  await expect(page.locator('output')).toContainText('有效成员');
});
