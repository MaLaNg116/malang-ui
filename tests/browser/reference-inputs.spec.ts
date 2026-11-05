import {test as base,expect} from '@playwright/test';
import type{Page}from'@playwright/test';
const test=base.extend<{errors:string[]}>({errors:[async({page},use)=>{const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='warning'&&message.text().includes('[Vue warn]'))errors.push(message.text());});await use(errors);expect(errors).toEqual([]);},{auto:true}]});
test.use({hasTouch:true});
const names:Record<string,string>={Cascader:'级联选择',TreeSelect:'树选择',ColorPicker:'颜色选择',ColorPickerPanel:'颜色面板',Rate:'评分',Transfer:'穿梭选择',InputOTP:'验证码',InputTag:'标签输入',Mention:'提及',TimePicker:'时间选择',TimeSelect:'时间列表',DateRangePicker:'日期区间',DateTimePicker:'日期时间',DatePickerPanel:'日期面板',Calendar:'日历'};
async function open(page:Page,component:string,boundary:boolean|'parent-keys'=false,globals='theme:light;motion:reduced'){const response=await page.request.get('/index.json');expect(response.ok()).toBeTruthy();const entries=Object.values((await response.json()).entries)as{id:string;title:string;type:string}[];const entry=entries.find(item=>item.type==='story'&&item.title===`表单组件/输入日期/${component} ${names[component]}`&&item.id.endsWith(typeof boundary==='string'?`--${boundary}`:boundary?'--boundary':'--default'));expect(entry).toBeDefined();await page.goto('/iframe.html?'+new URLSearchParams({id:entry!.id,viewMode:'story',globals}));await page.locator('#storybook-root .kit-story-surface').waitFor();await page.locator('[data-reference-model]').waitFor();}
const model=(page:Page)=>page.locator('[data-reference-model]');
async function valid(page:Page){return page.locator('form').evaluate(element=>(element as HTMLFormElement).checkValidity());}
async function paste(page:Page,selector:string,text:string){await page.locator(selector).first().evaluate((element,text)=>{const data=new DataTransfer();data.setData('text/plain',text);element.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},text);}
async function reopenWithDeclinedUpdates(page: Page, label: string) {
  const popup = page.getByRole('dialog', { name: label, exact: true });
  await popup.getByRole('button', { name: '关闭气泡', exact: true }).click();
  await expect(popup).toBeHidden();
  await page.getByRole('button', { name: '拒绝更新', exact: true }).click();
  await expect(page.getByRole('button', { name: '接受更新', exact: true })).toBeVisible();
  await page.getByRole('button', { name: label, exact: true }).click();
}

test('cascader selects full paths, searches leaves, checks multiple descendant paths and retries rejected changes',async({page})=>{
  await open(page,'Cascader');await page.getByRole('button',{name:'档案路径',exact:true}).click();await page.getByRole('button',{name:'封存',exact:true}).isDisabled().then(value=>expect(value).toBe(true));
  await page.getByRole('textbox',{name:'搜索档案路径',exact:true}).fill('鎏金');await page.getByRole('button',{name:'绢素 / 鎏金',exact:true}).click();await expect(model(page)).toHaveText('["cloth","gold"]');await page.getByRole('button',{name:'提交表单',exact:true}).click();await expect(page.locator('[data-reference-form]')).toContainText('cloth');
  await open(page,'Cascader',true);await page.getByRole('button',{name:'档案路径',exact:true}).click();await page.getByRole('checkbox',{name:'cloth 绢素',exact:true}).click();await expect(page.getByRole('checkbox',{name:'cloth 绢素',exact:true})).toBeChecked();await expect(model(page)).toContainText('["cloth","gold"]');await expect(model(page)).toContainText('["cloth","weave"]');await expect(page.getByRole('checkbox',{name:'locked 封存',exact:true})).toBeDisabled();
  await reopenWithDeclinedUpdates(page, '档案路径');
  const paper = page.getByRole('checkbox', { name: 'paper 纸本', exact: true });
  await paper.click();
  await expect(paper).toBeChecked();
  await paper.click();
  await expect(paper).toBeChecked();
  await expect(page.locator('[data-reference-requests]')).toHaveText('请求 3');
});

test('tree select filters hierarchy, expands nodes and handles controlled multiple and disabled descendants',async({page})=>{
  await open(page,'TreeSelect');await page.getByRole('button',{name:'归档目录',exact:true}).click();await page.getByRole('button',{name:'展开纸本',exact:true}).click();await page.getByRole('button',{name:'墨迹',exact:true}).click();await expect(model(page)).toHaveText('"ink"');
  await open(page, 'TreeSelect', true);
  await page.getByRole('button', { name: '归档目录', exact: true }).click();
  const search = page.getByRole('textbox', { name: '搜索归档目录', exact: true });
  await search.fill('鎏金');
  const gold = page.getByRole('checkbox', { name: '绢素 / 鎏金', exact: true });
  await gold.click();
  await expect(model(page)).toHaveText('["ink","gold"]');
  await search.fill('封存');
  await expect(page.getByRole('checkbox', { name: '封存', exact: true })).toBeDisabled();
  await reopenWithDeclinedUpdates(page, '归档目录');
  await search.fill('鎏金');
  await gold.click();
  await expect(gold).toBeChecked();
  await gold.click();
  await expect(gold).toBeChecked();
  await expect(model(page)).toHaveText('["ink","gold"]');
  await expect(page.locator('[data-reference-requests]')).toHaveText('请求 3');
  await open(page,'TreeSelect','parent-keys');await expect(model(page)).toHaveText('["cloth"]');await expect(page.locator('[data-reference-requests]')).toHaveText('请求 0');await page.getByRole('button',{name:'归档目录',exact:true}).click();await page.getByRole('button',{name:'展开绢素',exact:true}).click();const projectedGold=page.getByRole('checkbox',{name:'绢素 / 鎏金',exact:true}),weave=page.getByRole('checkbox',{name:'绢素 / 经纬',exact:true});await expect(projectedGold).toBeChecked();await expect(weave).toBeChecked();await projectedGold.click();await expect(projectedGold).not.toBeChecked();await expect(model(page)).toHaveText('["weave"]');await expect(weave).toBeChecked();await expect(page.getByRole('checkbox',{name:'绢素',exact:true})).toHaveJSProperty('indeterminate',true);
});

test('HSV/HEX/alpha controls actually transform colors, presets submit and invalid colors block validation',async({page})=>{
  await open(page,'ColorPickerPanel');const hex=page.getByRole('textbox',{name:'HEX',exact:true});await hex.fill('#FF000080');await hex.press('Enter');await expect(model(page)).toHaveText('"#FF000080"');const hue=page.getByRole('slider',{name:/色相/});await hue.focus();await hue.press('ArrowRight');await expect(model(page)).not.toHaveText('"#FF000080"');await page.getByRole('button',{name:'#FFFFFF',exact:true}).click();await expect(model(page)).toHaveText('"#FFFFFFFF"');
  await open(page,'ColorPickerPanel',true);expect(await valid(page)).toBe(false);await page.getByRole('textbox',{name:'HEX',exact:true}).fill('#12345678');await page.getByRole('textbox',{name:'HEX',exact:true}).press('Enter');expect(await valid(page)).toBe(true);
  await open(page,'ColorPicker',true);await page.getByRole('button',{name:'刻印颜色',exact:true}).click();await page.getByRole('button',{name:'#FFFFFF00',exact:true}).click();await expect(model(page)).toHaveText('"#FFFFFF00"');
});

test('rate supports half steps and clearing, while transfer searches/selects/moves actual form values and retries rejection',async({page})=>{
  await open(page,'Rate');const rate=page.getByRole('slider',{name:'构形评分',exact:true});await rate.press('ArrowRight');await expect(model(page)).toHaveText('3');await rate.press('End');await expect(model(page)).toHaveText('5');await page.getByRole('button',{name:'清空',exact:true}).click();await expect(model(page)).toHaveText('0');await open(page,'Rate',true);await expect(page.getByRole('slider')).toBeDisabled();
  await open(page,'Transfer');await page.getByRole('checkbox',{name:'刻印',exact:true}).check();await page.getByRole('button',{name:'移入已选',exact:true}).click();await expect(model(page)).toHaveText('["ink","seal"]');await page.getByRole('button',{name:'提交表单',exact:true}).click();await expect(page.locator('[data-reference-form]')).toContainText('seal');await page.getByRole('button',{name:'拒绝更新',exact:true}).click();await page.getByRole('textbox',{name:'搜索待选项目',exact:true}).fill('鎏金');await page.getByRole('checkbox',{name:'鎏金',exact:true}).check();await page.getByRole('button',{name:'移入已选',exact:true}).click();await page.getByRole('button',{name:'移入已选',exact:true}).click();await expect(model(page)).toHaveText('["ink","seal"]');await expect(page.locator('[data-reference-requests]')).toHaveText('请求 3');await open(page,'Transfer',true);await expect(page.getByRole('checkbox',{name:'封存资料',exact:true})).toBeDisabled();
});

test('OTP pastes, removes and validates digits, keeps masked text support and restores declined input',async({page})=>{
  await open(page,'InputOTP');expect(await valid(page)).toBe(false);await paste(page,'.ui-ri-otp__digit','12a3456');await expect(model(page)).toHaveText('"123456"');expect(await valid(page)).toBe(true);const digits=page.locator('.ui-ri-otp__digit');await digits.nth(5).press('Backspace');await expect(model(page)).toHaveText('"12345"');expect(await valid(page)).toBe(false);await page.getByRole('button',{name:'拒绝更新',exact:true}).click();await digits.nth(5).fill('8');await expect(digits.nth(5)).toHaveValue('');await digits.nth(5).fill('8');await expect(model(page)).toHaveText('"12345"');await open(page,'InputOTP',true);await expect(page.locator('.ui-ri-otp__digit').first()).toHaveAttribute('type','password');await page.locator('.ui-ri-otp__digit').first().fill('Z');await expect(model(page)).toHaveText('"ZB12"');
});

test('tag input preserves composition, rejects duplicates and readonly removal; mentions insert actual candidates at the caret',async({page})=>{
  await open(page,'InputTag');const tag=page.getByRole('textbox',{name:'档案关键词',exact:true});await tag.dispatchEvent('compositionstart');await tag.fill('青玉');await tag.press('Enter');await expect(model(page)).toHaveText('["墨迹"]');await tag.dispatchEvent('compositionend');await tag.press('Enter');await expect(model(page)).toHaveText('["墨迹","青玉"]');await tag.fill('青玉');await tag.press('Enter');await expect(page.getByRole('alert')).toHaveText('标签不能重复。');await page.getByRole('button',{name:'移除标签青玉',exact:true}).click();await expect(tag).toBeFocused();await open(page,'InputTag',true);await expect(page.getByRole('button',{name:/移除标签/})).toHaveCount(0);await expect(page.getByRole('textbox')).not.toBeEditable();
  await open(page,'Mention');const mention=page.getByRole('textbox',{name:'协作说明',exact:true});await mention.fill('@ma');await expect(page.getByRole('option',{name:'MaLang',exact:true})).toBeVisible();await mention.press('Enter');await expect(model(page)).toHaveText('"@malang "');await expect(mention).toBeFocused();await mention.fill('#');await mention.press('ArrowDown');await mention.press('Enter');await expect(model(page)).toHaveText('"#ink "');await open(page,'Mention',true);await expect(page.getByRole('textbox',{name:'协作说明',exact:true})).not.toBeEditable();
});

test('time picker validates limits/steps and seconds, and time select generates real bounded options with controlled recovery',async({page})=>{
  await open(page,'TimePicker');const time=page.getByRole('textbox',{name:'归档时间',exact:true});await time.fill('09:31');await time.press('Enter');expect(await valid(page)).toBe(false);await time.fill('10:00');await time.press('Enter');await expect(model(page)).toHaveText('"10:00"');await page.getByRole('button',{name:'选择归档时间',exact:true}).click();await page.getByRole('button',{name:'45分',exact:true}).click();await expect(model(page)).toHaveText('"10:45"');await open(page,'TimePicker',true);await page.getByRole('textbox',{name:'归档时间',exact:true}).fill('23:59:59');await page.getByRole('textbox',{name:'归档时间',exact:true}).press('Enter');expect(await valid(page)).toBe(false);
  await open(page,'TimeSelect');const select=page.getByRole('combobox',{name:'预约时段',exact:true});await select.selectOption('09:30');await expect(model(page)).toHaveText('"09:30"');await page.getByRole('button',{name:'拒绝更新',exact:true}).click();await select.selectOption('10:00');await expect(select).toHaveValue('09:30');await select.selectOption('10:00');await expect(page.locator('[data-reference-requests]')).toHaveText('请求 3');await open(page,'TimeSelect',true);expect(await valid(page)).toBe(false);
  await open(page,'TimePicker');const resetTime=page.getByRole('textbox',{name:'归档时间',exact:true});await resetTime.fill('broken');expect(await valid(page)).toBe(false);await page.locator('form').evaluate(form=>(form as HTMLFormElement).reset());await expect(resetTime).toHaveValue('09:30');expect(await valid(page)).toBe(true);
});

test('date ranges reject reversed endpoints and reset drafts; datetime requires a valid combined bounded value',async({page})=>{
  await open(page,'DateRangePicker');await page.getByRole('textbox',{name:'结束日期',exact:true}).fill('2026-11-15');await page.getByRole('textbox',{name:'结束日期',exact:true}).press('Enter');await expect(model(page)).toHaveText('["2026-11-05","2026-11-15"]');await page.getByRole('button',{name:'提交表单',exact:true}).click();await expect(page.locator('[data-reference-form]')).toContainText('2026-11-15');await open(page,'DateRangePicker',true);expect(await valid(page)).toBe(false);await page.getByRole('textbox',{name:'结束日期',exact:true}).fill('2026-11-16');await page.getByRole('textbox',{name:'结束日期',exact:true}).press('Enter');expect(await valid(page)).toBe(true);
  await open(page,'DateTimePicker');const time=page.getByRole('textbox',{name:'时间',exact:true});await time.fill('10:15');await time.press('Enter');await expect(model(page)).toHaveText('"2026-11-05T10:15"');await page.getByRole('button',{name:'恢复初值',exact:true}).click();await expect(model(page)).toHaveText('"2026-11-05T09:30"');await open(page,'DateTimePicker',true);expect(await valid(page)).toBe(false);
});

test('date panels use navigable month grids at supported year edges and calendar exposes functional date slots',async({page})=>{
  await open(page,'DatePickerPanel');const day=page.getByRole('button',{name:'2026-11-05',exact:true});await day.focus();await day.press('ArrowRight');await expect(page.getByRole('button',{name:'2026-11-06',exact:true})).toBeFocused();await page.keyboard.press('Space');await expect(model(page)).toHaveText('"2026-11-06"');await page.getByRole('button',{name:'下个月',exact:true}).click();await expect(page.getByRole('grid')).toHaveAttribute('aria-label','2026年12月');await open(page,'DatePickerPanel',true);await expect(page.getByRole('button',{name:'上个月',exact:true})).toBeDisabled();
  await open(page,'Calendar');await expect(page.getByRole('button',{name:'2026-11-15',exact:true})).toContainText('归档');await page.getByRole('button',{name:'2026-11-15',exact:true}).click();await expect(model(page)).toHaveText('"2026-11-15"');await open(page,'Calendar',true);await expect(page.getByRole('button',{name:'下个月',exact:true})).toBeDisabled();
});

for(const components of [['Cascader','TreeSelect','ColorPicker','ColorPickerPanel','Rate'],['Transfer','InputOTP','InputTag','Mention','TimePicker'],['TimeSelect','DateRangePicker','DateTimePicker','DatePickerPanel','Calendar']])test('360px light/dark keeps '+components.join('/')+' usable with reduced motion',async({page})=>{
  await page.setViewportSize({width:360,height:800});await page.emulateMedia({reducedMotion:'reduce'});
  for(const component of components)for(const theme of ['light','dark']){await open(page,component,false,`theme:${theme};palette:celadon;motion:reduced`);expect(await page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);await expect(page.locator('[data-reference-model]')).toBeVisible();}
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await expect(page.locator('[data-reference-model]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);const control=page.locator('.ui-ri button:not(:disabled),.ui-ri input:not([type=hidden]):not(.ui-ri__bridge):not(:disabled),.ui-ri select:not(:disabled),.ui-ri textarea:not(:disabled)').first();await control.focus();await expect(control).toBeFocused();expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});
