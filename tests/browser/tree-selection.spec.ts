import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const test=base.extend<{errors:string[]}>({errors:[async({page},use)=>{const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='warning'&&message.text().includes('[Vue warn]'))errors.push(message.text());});await use(errors);expect(errors).toEqual([]);},{auto:true}]});
async function open(page:Page,title:string,exportName:string){const response=await page.request.get('/index.json');expect(response.ok()).toBeTruthy();const entries=Object.values((await response.json()).entries)as{id:string;title:string;exportName?:string;type:string}[];const story=entries.find(entry=>entry.type==='story'&&entry.title===title&&entry.exportName===exportName);expect(story).toBeDefined();await page.goto('/iframe.html?'+new URLSearchParams({id:story!.id,viewMode:'story',globals:'theme:light;palette:celadon;motion:reduced'}));await page.locator('#storybook-root .kit-story-surface').waitFor();}
const treeTitle='二级组件/Tree 层级目录';
const item=(page:Page,name:string)=>page.getByRole('treeitem',{name,exact:true});

test('tree checks cascade through enabled descendants, expose mixed state and keep roving selection independent',async({page})=>{
  await open(page,treeTitle,'Checkable');const assets=item(page,'素材总卷'),design=item(page,'设计资料'),alpha=item(page,'Alpha · 水墨界面'),beta=item(page,'Beta · 机械切面');
  await expect(assets).toHaveAttribute('aria-checked','mixed');await expect(design).toHaveAttribute('aria-checked','mixed');await alpha.focus();await alpha.press('ArrowDown');await expect(beta).toBeFocused();await expect(beta).toHaveAttribute('aria-selected','false');await beta.press('Space');await expect(beta).toHaveAttribute('aria-checked','true');await expect(design).toHaveAttribute('aria-checked','true');await expect(assets).toHaveAttribute('aria-checked','mixed');await expect(alpha).toHaveAttribute('aria-selected','true');
  await assets.focus();await assets.press('Space');await expect(assets).toHaveAttribute('aria-checked','true');await expect(item(page,'Audio · 动作音效')).toHaveAttribute('aria-checked','true');await assets.press('Space');await expect(assets).toHaveAttribute('aria-checked','false');await expect(alpha).toHaveAttribute('aria-checked','false');
  await item(page,'封存目录').focus();await page.keyboard.press('Space');await expect(item(page,'封存目录')).toHaveAttribute('aria-checked','false');await expect(item(page,'封存目录')).toHaveAttribute('aria-disabled','true');expect(await page.getByRole('tree').locator('[role=treeitem][tabindex="0"]').count()).toBe(1);
});

test('tree strict checks stay independent and multiple selection preserves check state, typeahead and narrow forced-color focus',async({page})=>{
  await open(page,treeTitle,'StrictChecks');await expect(item(page,'素材总卷')).toHaveAttribute('aria-checked','true');await expect(item(page,'Alpha · 水墨界面')).toHaveAttribute('aria-checked','false');await item(page,'Alpha · 水墨界面').focus();await page.keyboard.press('Space');await expect(item(page,'Alpha · 水墨界面')).toHaveAttribute('aria-checked','true');await expect(item(page,'设计资料')).toHaveAttribute('aria-checked','false');await expect(item(page,'封存目录')).toHaveAttribute('aria-checked','true');
  await open(page, treeTitle, 'Multiple');
  await expect(page.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
  const beta = item(page, 'Beta · 机械切面');
  const audio = item(page, 'Audio · 动作音效');
  const alpha = item(page, 'Alpha · 水墨界面');
  await beta.focus();
  await beta.press('Enter');
  await expect(beta).toHaveAttribute('aria-selected', 'true');
  await expect(alpha).toHaveAttribute('aria-selected', 'true');
  await expect(audio).toHaveAttribute('aria-selected', 'true');
  await expect(beta).toHaveAttribute('aria-checked', 'true');
  await beta.press('Space');
  await expect(beta).toHaveAttribute('aria-checked', 'false');
  await expect(beta).toHaveAttribute('aria-selected', 'true');
  await beta.press('a');
  await expect(audio).toBeFocused();
  await page.keyboard.press('a');
  await expect(alpha).toBeFocused();
  await page.setViewportSize({width:360,height:800});await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});expect(await page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);await expect(item(page,'Alpha · 水墨界面')).toBeFocused();
});

test('tree rejected check and selection requests can repeat, while a disabled parent blocks batch propagation but not an independent child',async({page})=>{
  await open(page,treeTitle,'ControlledChecks');const alpha=item(page,'Alpha · 水墨界面'),assets=item(page,'素材总卷');await assets.focus();await assets.press('Space');await expect(assets).toHaveAttribute('aria-checked','mixed');await assets.press('Space');await expect(assets).toHaveAttribute('aria-checked','mixed');await assets.press('Enter');await assets.press('Enter');await expect(assets).toHaveAttribute('aria-selected','false');await expect(page.locator('[data-tree-check-requests]')).toHaveText('复选请求 2；选择请求 2');await expect(alpha).toHaveAttribute('aria-checked','true');
  await page.getByRole('button',{name:'接受目录更新',exact:true}).click();await assets.focus();await assets.press('Space');await expect(assets).toHaveAttribute('aria-checked','true');await expect(item(page,'封存目录')).toHaveAttribute('aria-checked','false');const legacy=item(page,'封存子卷');await legacy.focus();await legacy.press('Space');await expect(legacy).toHaveAttribute('aria-checked','true');await expect(item(page,'封存目录')).toHaveAttribute('aria-checked','false');await assets.press('Enter');await expect(assets).toHaveAttribute('aria-selected','true');await expect(alpha).toHaveAttribute('aria-selected','true');
});

test('standalone radios keep native grouping, external form values and reset, restoring both siblings after controlled rejection',async({page})=>{
  await open(page,'基础组件/Radio 单选','Default');const paper=page.getByRole('radio',{name:'宣纸',exact:true}),cloth=page.getByRole('radio',{name:'绢素',exact:true}),external=page.getByRole('radio',{name:'外置材质',exact:true});await expect(paper).toBeChecked();await page.getByRole('button',{name:'拒绝材质更新',exact:true}).click();await cloth.click();await expect(cloth).not.toBeChecked();await expect(paper).toBeChecked();await cloth.click();await expect(cloth).not.toBeChecked();await expect(paper).toBeChecked();await expect(page.locator('[data-radio-requests]')).toHaveText('请求 2');
  await page.getByRole('button',{name:'接受材质更新',exact:true}).click();await paper.focus();await paper.press('ArrowRight');await expect(cloth).toBeChecked();await expect(cloth).toBeFocused();await expect(page.getByRole('radio',{name:'封存',exact:true})).toBeDisabled();await external.check();await page.getByRole('button',{name:'提交材质',exact:true}).click();await expect(page.locator('[data-radio-form]')).toHaveText('[["material","external"]]');await page.getByRole('button',{name:'恢复材质',exact:true}).click();await expect(paper).toBeChecked();await expect(external).not.toBeChecked();await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});await paper.focus();await expect(paper).toBeFocused();
  await open(page,'基础组件/Radio 单选','Boundary');expect(await page.locator('form').evaluate(form=>(form as HTMLFormElement).checkValidity())).toBe(false);await page.getByRole('radio',{name:'绢素',exact:true}).check();expect(await page.locator('form').evaluate(form=>(form as HTMLFormElement).checkValidity())).toBe(true);
});
