import {test as base,expect} from '@playwright/test';
import type{Page}from'@playwright/test';
const test=base.extend<{errors:string[]}>({errors:[async({page},use)=>{const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='warning'&&message.text().includes('[Vue warn]'))errors.push(message.text());});await use(errors);expect(errors).toEqual([]);},{auto:true}]});
async function open(page:Page,name:string){const response=await page.request.get('/index.json');expect(response.ok()).toBeTruthy();const entries=Object.values((await response.json()).entries)as{id:string;title:string;type:string;exportName?:string}[];const entry=entries.find(item=>item.title==='基础组件/CheckboxGroup 复选组'&&item.type==='story'&&item.exportName===name);expect(entry).toBeDefined();await page.goto('/iframe.html?'+new URLSearchParams({id:entry!.id,viewMode:'story',globals:'theme:light;palette:celadon;motion:reduced'}));await page.locator('#storybook-root .kit-story-surface').waitFor();await page.locator('[data-checkbox-owner]').waitFor();}
const valid=(page:Page)=>page.locator('form').evaluate(form=>(form as HTMLFormElement).checkValidity());
const values=(page:Page)=>page.locator('form').evaluate(form=>new FormData(form as HTMLFormElement).getAll('materials'));

test('unknown and duplicate owner values neither satisfy native constraints nor lock out real options',async({page})=>{
  await open(page,'UnknownValue');await expect(page.locator('[data-checkbox-owner]')).toHaveText('["missing","unknown"]');expect(await valid(page)).toBe(false);await expect(page.getByRole('checkbox',{name:'宣纸',exact:true})).toBeEnabled();await page.getByRole('checkbox',{name:'宣纸',exact:true}).check();expect(await valid(page)).toBe(true);expect(await values(page)).toEqual(['paper']);await expect(page.locator('[data-checkbox-owner]')).toHaveText('["missing","unknown","paper"]');await expect(page.getByRole('checkbox',{name:'浓墨',exact:true})).toBeDisabled();
  await open(page,'DuplicateValues');expect(await valid(page)).toBe(false);expect(await values(page)).toEqual(['paper']);await expect(page.getByRole('checkbox',{name:'浓墨',exact:true})).toBeEnabled();await page.getByRole('checkbox',{name:'浓墨',exact:true}).check();expect(await valid(page)).toBe(true);expect(await values(page)).toEqual(['paper','ink']);await expect(page.locator('[data-checkbox-owner]')).toHaveText('["paper","paper","ink"]');await expect(page.getByRole('checkbox',{name:'青玉',exact:true})).toBeDisabled();await page.getByRole('checkbox',{name:'宣纸',exact:true}).uncheck();expect(await valid(page)).toBe(false);
  await open(page,'AboveMaximum');expect(await valid(page)).toBe(false);await page.getByRole('checkbox',{name:'青玉',exact:true}).uncheck();expect(await valid(page)).toBe(false);await page.getByRole('checkbox',{name:'浓墨',exact:true}).uncheck();expect(await valid(page)).toBe(true);expect(await values(page)).toEqual(['paper']);
});

test('disabled selections are omitted from native values and empty option sets still enforce required',async({page})=>{
  await open(page,'DisabledSelection');const locked=page.getByRole('checkbox',{name:'封存',exact:true});await expect(locked).toBeChecked();await expect(locked).toBeDisabled();expect(await valid(page)).toBe(false);expect(await values(page)).toEqual([]);await expect(page.getByRole('checkbox',{name:'宣纸',exact:true})).toBeEnabled();await page.getByRole('checkbox',{name:'宣纸',exact:true}).check();expect(await valid(page)).toBe(true);expect(await values(page)).toEqual(['paper']);await page.getByRole('button',{name:'提交材质',exact:true}).click();await expect(page.locator('[data-checkbox-result]')).toHaveText('[["materials","paper"]]');
  await open(page,'EmptyOptions');expect(await valid(page)).toBe(false);await expect(page.getByRole('alert')).toContainText('所选项目不足');
});

test('controlled checkbox rejection can repeat and external native reset restores the current owner at 360px',async({page})=>{
  await open(page,'Default');const paper=page.getByRole('checkbox',{name:'宣纸',exact:true}),ink=page.getByRole('checkbox',{name:'浓墨',exact:true});await page.getByRole('button',{name:'拒绝材质更新',exact:true}).click();await ink.click();await expect(ink).not.toBeChecked();await ink.click();await expect(ink).not.toBeChecked();await expect(paper).toBeChecked();await expect(page.locator('[data-checkbox-requests]')).toHaveText('请求 2');
  await page.getByRole('button',{name:'接受材质更新',exact:true}).click();await ink.check();await paper.uncheck();await expect(page.locator('[data-checkbox-owner]')).toHaveText('["ink"]');await page.locator('form').evaluate(form=>(form as HTMLFormElement).reset());await expect(ink).toBeChecked();await expect(paper).not.toBeChecked();expect(await values(page)).toEqual(['ink']);
  await page.setViewportSize({width:360,height:700});await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await ink.focus();await expect(ink).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
});

test('a registered required checkbox group blocks an empty MForm submission and recovers after selection', async ({ page }) => {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, { id: string; title: string; type: string }> };
  const story = Object.values(index.entries).find(entry => entry.title === '基础组件/Form 动态字段' && entry.type === 'story' && entry.id.endsWith('--default'));
  expect(story).toBeDefined();
  const params = new URLSearchParams({ id: story!.id, viewMode: 'story', globals: 'theme:light;motion:reduced' });
  await page.goto(`/iframe.html?${params}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();

  const form = page.getByRole('form', { name: '档案成员', exact: true });
  const group = form.getByRole('group', { name: '组合复选材质', exact: true });
  const submit = form.getByRole('button', { name: '提交动态表单', exact: true });
  const output = form.locator('output');
  const error = group.getByRole('alert');
  await form.getByRole('textbox', { name: '档案名', exact: true }).fill('墨浪库');
  await form.getByRole('textbox', { name: '成员1', exact: true }).fill('有效成员');
  await group.getByRole('checkbox', { name: '宣纸', exact: true }).uncheck();
  await submit.click();
  await expect(error).toContainText('所选项目不足');
  await expect(form.getByRole('region', { name: '表单校验结果', exact: true })).toContainText('组合复选材质');
  await expect(output).toBeEmpty();

  await group.getByRole('checkbox', { name: '浓墨', exact: true }).check();
  await expect(error).toBeVisible();
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(true);
  await submit.click();
  await expect(output).toContainText('"checked":["ink"]');
  await expect(error).toHaveCount(0);
  expect(await form.evaluate((element: HTMLFormElement) => new FormData(element).getAll('checked'))).toEqual(['ink']);
});
