import{expect,test}from'@playwright/test';import type{Page}from'@playwright/test';
async function open(page:Page,story='default'){const entries=Object.values((await(await page.request.get('/index.json')).json()).entries)as{type:string;title:string;id:string}[];const entry=entries.find(item=>item.type==='story'&&item.title==='数据组件/AutoComplete 输入建议'&&item.id.endsWith(`--${story}`));expect(entry).toBeDefined();await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=theme:dark;motion:reduced`);await page.locator('#storybook-root .kit-story-surface').waitFor();}
test('autocomplete submits arbitrary text and only explicitly selected suggestions replace it',async({page})=>{
  await open(page);const input=page.getByRole('combobox',{name:'自由命名',exact:true});await input.fill('我的独立卷宗');await input.press('Enter');await expect(page.locator('[data-auto-submitted]')).toHaveText('提交：我的独立卷宗');
  await input.fill('ink');await input.press('ArrowDown');await input.press('ArrowDown');await input.press('Enter');await expect(input).toHaveValue('ink-wheel');await expect(page.locator('[data-auto-state]')).toContainText('补全：ink-wheel');await expect(input).toBeFocused();
  await input.press('Escape');await input.press('Home');expect(await input.evaluate(element=>(element as HTMLInputElement).selectionStart)).toBe(0);await page.getByRole('button',{name:'提交名称',exact:true}).click();await expect(page.locator('[data-auto-submitted]')).toHaveText('提交：ink-wheel');
});
test('autocomplete preserves IME, controlled rejections, readonly native submission and outside editing focus',async({page})=>{
  await open(page);
  const input = page.getByRole('combobox', { name: '自由命名', exact: true });
  const list = page.getByRole('listbox', { name: '自由命名建议', exact: true });
  const acceptsUpdate = page.getByRole('checkbox', { name: '接受文本更新', exact: true });
  await input.focus();
  await input.dispatchEvent('compositionstart');
  await input.fill('中文卷宗');
  await input.press('Enter');
  await expect(input).toHaveValue('中文卷宗');
  await expect(page.locator('[data-auto-state]')).toHaveText('文本：；请求：0；补全：');
  await expect(page.locator('[data-auto-submitted]')).toHaveText('提交：');
  await input.dispatchEvent('compositionend');
  await expect(page.locator('[data-auto-state]')).toContainText('文本：中文卷宗；请求：1');

  await input.press('Escape');
  await expect(list).toBeHidden();
  await expect(input).toHaveValue('中文卷宗');
  await acceptsUpdate.uncheck();
  await input.fill('被拒绝的名称');
  await expect(input).toHaveValue('中文卷宗');
  await input.press('Escape');
  await expect(list).toBeHidden();
  await acceptsUpdate.check();
  await input.fill('被拒绝的名称');
  await expect(input).toHaveValue('被拒绝的名称');

  const outside = page.getByRole('textbox', { name: '建议输入外的草稿', exact: true });
  const form = page.locator('form');
  await outside.focus();
  await page.getByRole('button', { name: '程序更新名称', exact: true }).evaluate(element => (element as HTMLButtonElement).click());
  await expect(outside).toBeFocused();
  await expect(input).toHaveValue('program-title');
  await page.getByRole('checkbox', { name: '只读命名', exact: true }).check();
  await input.click();
  await expect(list).toBeHidden();
  expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('title'))).toBe('program-title');

  await page.getByRole('button', { name: '重置名称表单', exact: true }).click();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  await expect(input).toHaveValue('program-title');
  await page.getByRole('checkbox', { name: '禁用命名', exact: true }).check();
  expect(await form.evaluate(element => new FormData(element as HTMLFormElement).get('title'))).toBeNull();
});
test('business-owned async suggestions remain keyboard usable without stealing external focus at 360px',async({page})=>{
  await page.setViewportSize({width:360,height:640});await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});await open(page,'async-suggestions');await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z'));const input=page.getByRole('combobox',{name:'异步命名建议',exact:true});await input.fill('ink');await expect(page.getByRole('listbox')).toHaveAttribute('aria-busy','true');const outside=page.getByRole('textbox',{name:'异步建议外的草稿',exact:true});await outside.focus();await page.clock.runFor(300);await expect(outside).toBeFocused();await expect(page.getByRole('listbox')).toBeHidden();await input.focus();await input.press('ArrowDown');await input.press('Enter');await expect(input).toHaveValue('ink-paper');await expect(page.locator('[data-auto-searches]')).toContainText('查询：1');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});
