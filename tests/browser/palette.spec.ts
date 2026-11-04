import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import tokens from '../../design/tokens.json' with { type: 'json' };

const test = base.extend<{ errors: string[] }>({ errors: [async ({ page }, use) => { const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'&&m.text().includes('[Vue warn]'))errors.push(m.text());});await use(errors);expect(errors).toEqual([]); }, {auto:true}] });
async function storyId(page:Page,title:string){const r=await page.request.get('/index.json');expect(r.ok()).toBeTruthy();const entries=Object.values((await r.json()).entries) as {id:string;title:string;type:string}[];const entry=entries.find(e=>e.type==='story'&&e.title===title&&e.id.endsWith('--default'));expect(entry).toBeDefined();return entry!.id;}
async function open(page:Page,title:string){const id=await storyId(page,title);await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light;palette:paper;motion:reduced`);await page.locator('.kit-story-surface').waitFor();}
const keys=['paper','celadon','gilt'] as const;
function colors(key:typeof keys[number]){return {...tokens.themes.light,...tokens.lightPalettes[key].colors};}
function rgb(hex:string){return 'rgb('+hex.slice(1).match(/../g)!.map(part=>parseInt(part,16)).join(', ')+')';}
function imageHash(element:HTMLCanvasElement){const values=element.getContext('2d')!.getImageData(0,0,element.width,element.height).data;let hash=2166136261;for(let i=0;i<values.length;i+=29)hash=Math.imul(hash^values[i]!,16777619);return hash>>>0;}

test('applies three complete light materials without rewriting a draft and isolates nested dark or default light scopes',async({page})=>{
 await open(page,'基础组件/Input 输入框');const field=page.getByRole('textbox').first();await field.fill('保留这一笔 · palette');const surface=page.locator('.kit-story-surface');
 for(const key of keys){await surface.evaluate((e,k)=>{e.setAttribute('data-ui-theme','light');e.setAttribute('data-ui-palette',k);},key);await expect.poll(()=>surface.evaluate(e=>getComputedStyle(e).getPropertyValue('--ui-color-accent').trim())).toBe(colors(key)['color-accent']);await expect(field).toHaveValue('保留这一笔 · palette');await field.focus();await expect(field).toBeFocused();await expect.poll(()=>field.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(rgb(colors(key)['color-surface-raised']));}
 await surface.evaluate(e=>{e.setAttribute('data-ui-theme','dark');e.setAttribute('data-ui-palette','celadon');});await expect.poll(()=>surface.evaluate(e=>getComputedStyle(e).getPropertyValue('--ui-color-canvas').trim())).toBe(tokens.themes.dark['color-canvas']);
 const nested=await surface.evaluateHandle(e=>{const node=document.createElement('div');node.setAttribute('data-ui-theme','light');node.style.background='var(--ui-color-canvas)';e.append(node);return node;});expect(await nested.evaluate(e=>getComputedStyle(e).getPropertyValue('--ui-color-canvas').trim())).toBe(tokens.themes.light['color-canvas']);await nested.evaluate(e=>e.remove());
 await page.setViewportSize({width:360,height:800});expect(await page.evaluate(()=>document.documentElement.scrollWidth===document.documentElement.clientWidth)).toBe(true);
});

test('repaints all existing Canvas families on palette changes while holding a manually selected frame',async({page})=>{
 for(const title of ['动效/MG 轨道构形','动效/MG 墨迹切面','动效/MG 成功落印','动效/MG 品牌开场','动效/MG 双轨等待']){
  await open(page,title);const canvas=page.locator('canvas').first();const slider=page.getByRole('slider').first();const end=(await slider.getAttribute('max'))!;await slider.fill(end);await expect(slider).toHaveValue(end);
  // Exercise attributes on the canvas itself, which also covers Orbit's former parent-only observer.
  await canvas.evaluate(e=>{e.setAttribute('data-ui-theme','light');e.setAttribute('data-ui-palette','paper');});let previous=await canvas.evaluate(imageHash);
  for(const key of ['celadon','gilt'] as const){await canvas.evaluate((e,k)=>e.setAttribute('data-ui-palette',k),key);await expect.poll(()=>canvas.evaluate(imageHash)).not.toBe(previous);await expect(slider).toHaveValue(end);previous=await canvas.evaluate(imageHash);expect(await canvas.evaluate(e=>getComputedStyle(e).getPropertyValue('--ui-color-seal').trim())).toBe(colors(key)['color-seal']);}
 }
});

test('changes light palettes through the real Storybook toolbar while preserving the input instance and draft', async ({ page }) => {
 const id = await storyId(page, '基础组件/Input 输入框');
 await page.goto(`/?path=/story/${encodeURIComponent(id)}&globals=theme:light;palette:paper;motion:reduced`);
 const preview = page.frameLocator('#storybook-preview-iframe');
 const field = preview.getByRole('textbox').first();
 await field.fill('工具栏切色，草稿还在。');
 const original = await field.elementHandle();
 try {
  for (const [key, name] of [['celadon', '青瓷 · 冷玉'], ['gilt', '绢素 · 鎏金'], ['paper', '宣纸 · 朱砂']] as const) {
   await page.getByRole('button', { name: /浅色材质配色/ }).click();
   await page.getByRole('option', { name, exact: true }).click();
   await expect(preview.locator('.kit-story-surface')).toHaveAttribute('data-ui-palette', key);
   await expect.poll(() => field.evaluate(element => getComputedStyle(element).getPropertyValue('--ui-color-accent').trim())).toBe(colors(key)['color-accent']);
   await expect(field).toHaveValue('工具栏切色，草稿还在。');
   expect(await field.evaluate((element, saved) => element === saved, original)).toBe(true);
  }
 } finally { await original?.dispose(); }
});
