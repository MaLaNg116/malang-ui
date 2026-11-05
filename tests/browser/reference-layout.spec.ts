import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const test = base.extend<{ errors: string[] }>({ errors: [async ({ page }, use) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
  await use(errors); expect(errors).toEqual([]);
}, { auto: true }] });
test.use({ hasTouch: true });
const titles = {
  grid: '布局组件/Grid 栅格', cell: '布局组件/GridItem 栅格项', flex: '布局组件/Flex 弹性布局', layout: '布局组件/Layout 页面布局', splitter: '布局组件/Splitter 分隔面板', masonry: '布局组件/Masonry 瀑布流',
  anchor: '导航组件/Anchor 锚点目录', affix: '导航组件/Affix 固定', header: '导航组件/PageHeader 页头', float: '导航组件/FloatButton 浮动按钮', floats: '导航组件/FloatButtonGroup 浮动操作组',
  carousel: '展示组件/Carousel 走马灯', tour: '展示组件/Tour 漫游引导', watermark: '展示组件/Watermark 水印', beam: '展示组件/BorderBeam 边框流光',
};
async function open(page: Page, kind: keyof typeof titles, story = 'Default', globals = 'theme:light;palette:paper;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const entry = entries.find(item => item.type === 'story' && item.title === titles[kind] && (item.exportName === story || item.id.endsWith('--' + story.toLowerCase()))); expect(entry).toBeDefined();
  await page.goto('/iframe.html?' + new URLSearchParams({ id: entry!.id, viewMode: 'story', globals })); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true); }
async function boxes(locator: Locator) { return locator.evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height }; })); }
async function inViewport(page: Page, element: Locator) { const box = (await element.boundingBox())!, viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight })); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0); expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+.5); expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+.5); }

test('adapts grid spans, offsets, flex direction and page regions while headers retain real native actions', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 }); await open(page,'grid');
  const initial = await boxes(page.locator('.ui-grid-item')); expect(initial[0]!.width).toBeGreaterThan(initial[1]!.width*1.7); expect(initial[0]!.top).toBe(initial[1]!.top);
  await open(page,'grid','Boundary'); await page.setViewportSize({width:360,height:800});
  await expect.poll(() => page.getByTestId('responsive-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1); await noOverflow(page);
  await open(page,'cell','Boundary'); const cell = page.locator('.ui-grid-item').first(); expect(await cell.evaluate(element => getComputedStyle(element).gridColumnStart)).toBe('2'); await noOverflow(page);
  await open(page,'flex','Boundary'); await expect.poll(() => page.getByTestId('responsive-flex').evaluate(element => getComputedStyle(element).flexDirection)).toBe('column');
  await page.setViewportSize({width:1024,height:800}); await expect.poll(() => page.getByTestId('responsive-flex').evaluate(element => getComputedStyle(element).flexDirection)).toBe('row');
  await open(page,'layout'); let regions = await boxes(page.locator('.ui-layout__aside, .ui-layout__main')); expect(regions[0]!.left).toBeLessThan(regions[1]!.left);
  await page.setViewportSize({width:360,height:800}); await expect.poll(async () => { regions = await boxes(page.locator('.ui-layout__aside, .ui-layout__main')); return regions[0]!.bottom <= regions[1]!.top; }).toBe(true); await noOverflow(page);
  await open(page,'header'); await page.getByRole('button',{name:'返回档案列表',exact:true}).press('Enter'); await expect(page.getByRole('status')).toContainText('返回请求 1 次');
  await page.getByRole('button',{name:'新建卷宗',exact:true}).click(); await expect(page.getByRole('status')).toContainText('本地草稿已创建');
  await open(page,'header','Boundary','theme:dark;motion:reduced'); await expect(page.getByRole('heading',{level:1})).toContainText('ArchiveWithoutArtificialClipping'); await noOverflow(page);
});

test('resizes actual splitter panes by pointer and keyboard, collapses without losing drafts and releases an active drag on unmount', async ({ page }) => {
  await page.setViewportSize({width:1000,height:800}); await open(page,'splitter'); const separator = page.getByRole('separator',{name:'调整面板尺寸',exact:true});
  const draft = page.getByRole('textbox',{name:'左侧草稿',exact:true}); await draft.fill('拖动和折叠后保留的草稿'); const before = (await boxes(page.locator('.ui-splitter__pane')))[0]!.width;
  const box = (await separator.boundingBox())!; await page.mouse.move(box.x+box.width/2,box.y+40); await page.mouse.down(); await page.mouse.move(box.x+box.width/2+100,box.y+40); await page.mouse.up();
  expect((await boxes(page.locator('.ui-splitter__pane')))[0]!.width).toBeGreaterThan(before+50); await expect(draft).toHaveValue('拖动和折叠后保留的草稿');
  await separator.focus(); await separator.press('Home'); await expect(separator).toHaveAttribute('aria-valuenow','20'); await separator.press('End'); await expect(separator).toHaveAttribute('aria-valuenow','80');
  await separator.press('Enter'); await expect(separator).toHaveAttribute('aria-valuenow','0'); await expect(draft).toBeHidden(); await expect(separator).toBeFocused();
  await page.getByRole('button',{name:'展开第一个面板',exact:true}).click(); await expect(draft).toHaveValue('拖动和折叠后保留的草稿'); await expect(separator).toHaveAttribute('aria-valuenow','80');
  await open(page,'splitter','Boundary'); const vertical = page.getByRole('separator'); await expect(vertical).toHaveAttribute('aria-orientation','horizontal'); await vertical.focus(); await vertical.press('ArrowDown'); await expect(vertical).toHaveAttribute('aria-valuenow','37');
  await page.getByRole('button',{name:'切换禁用',exact:true}).click(); await expect(vertical).toHaveAttribute('aria-disabled','true'); await vertical.press('End'); await expect(vertical).toHaveAttribute('aria-valuenow','37');
  await page.getByRole('button',{name:'切换禁用',exact:true}).click(); const current = (await vertical.boundingBox())!; await page.mouse.move(current.x+25,current.y+20); await page.mouse.down();
  await page.getByRole('button',{name:'卸载分隔',exact:true}).evaluate(element => (element as HTMLButtonElement).click()); await page.mouse.up(); await expect(vertical).toHaveCount(0); await page.setViewportSize({width:360,height:700}); await noOverflow(page);
});

test('packs measured masonry items into the shortest column, repacks changed heights and keeps independent instances after cleanup', async ({ page }) => {
  await page.setViewportSize({width:1280,height:900}); await open(page,'masonry'); const list = page.getByRole('list',{name:'机关卷宗',exact:true}); await expect(list).toHaveAttribute('data-arranged','true');
  await expect.poll(async () => { const item = await boxes(list.getByRole('listitem')); return Math.abs(item[3]!.left-item[0]!.left)<1 && Math.abs(item[3]!.top-item[0]!.bottom-16)<1; }).toBe(true);
  const initial = await boxes(list.getByRole('listitem')); expect(initial[3]!.top).toBeLessThan(initial[1]!.bottom);
  await page.getByRole('button',{name:'改变首项高度',exact:true}).click(); await expect.poll(async () => { const item = await boxes(list.getByRole('listitem')); return Math.abs(item[3]!.left-item[2]!.left)<1; }).toBe(true);
  await page.getByRole('button',{name:'添加卷宗',exact:true}).click(); await expect(list.getByRole('listitem')).toHaveCount(7);
  await page.setViewportSize({width:360,height:800}); await expect.poll(async () => new Set((await boxes(list.getByRole('listitem'))).map(item => Math.round(item.left))).size).toBe(1); await noOverflow(page);
  const retired = await list.elementHandle(); await page.getByRole('button',{name:'卸载瀑布流',exact:true}).click(); await page.setViewportSize({width:800,height:800}); expect(await retired!.evaluate(element => element.isConnected)).toBe(false); await retired?.dispose();
  await open(page,'masonry','Boundary'); await expect(page.getByRole('list',{name:'空卷宗',exact:true}).getByText('暂无内容。',{exact:true})).toBeVisible(); await expect(page.getByRole('list',{name:'独立卷宗',exact:true}).getByRole('listitem')).toHaveCount(3); await noOverflow(page);
});

test('tracks a real scroll container without stealing outside focus and pins or releases affix content at its own boundary', async ({ page }) => {
  await open(page,'anchor'); const nav = page.getByRole('navigation',{name:'卷宗目录',exact:true}), scroll = page.getByTestId('anchor-scroll');
  const middle = nav.getByRole('link',{name:'校验',exact:true}); await middle.focus(); await middle.press('Enter'); await expect(middle).toHaveAttribute('aria-current','location');
  const draft = page.getByRole('textbox',{name:'目录外的草稿',exact:true}); await draft.focus(); await scroll.evaluate(element => element.scrollTo({top:element.scrollHeight,behavior:'instant'}));
  await expect(nav.getByRole('link',{name:'归档',exact:true})).toHaveAttribute('aria-current','location'); await expect(draft).toBeFocused();
  await open(page,'affix'); const stage = page.getByTestId('affix-scroll'); await stage.evaluate(element => element.scrollTo({top:220,behavior:'instant'}));
  await expect(page.locator('.ui-affix').first()).toHaveAttribute('data-affixed','true'); const pinned = page.locator('.ui-affix__content').first();
  await expect.poll(async () => { const bar=(await pinned.boundingBox())!,box=(await stage.boundingBox())!; return Math.abs(bar.y-box.y-9)<1; }).toBe(true);
  await pinned.getByRole('button',{name:'记录校验',exact:true}).click(); await expect(pinned).toContainText('已记录 1 次');
  await stage.evaluate(element => element.scrollTo({top:0,behavior:'instant'})); await expect(page.locator('.ui-affix').first()).not.toHaveAttribute('data-affixed');
  await open(page,'affix','Boundary'); await page.getByRole('button',{name:'卸载吸附',exact:true}).click(); await page.getByTestId('affix-scroll').evaluate(element => element.scrollTo({top:400,behavior:'instant'})); await page.setViewportSize({width:360,height:700});
  await expect(page.locator('.ui-affix')).toHaveCount(1); expect(await page.locator('.ui-affix__content').evaluate(element => getComputedStyle(element).position)).not.toBe('fixed'); await noOverflow(page);
});

test('uses real float actions, badge descriptions, disclosure keyboard order and declined controlled requests', async ({ page }) => {
  await open(page,'float'); const action=page.getByRole('button',{name:'待办提醒',exact:true}); await action.focus(); await expect(page.getByRole('tooltip')).toBeVisible(); await expect(action).toHaveAccessibleDescription(/查看尚未处理/); await action.press('Enter'); await expect(page.getByRole('status')).toHaveText('已查看 1 次');
  const size=(await action.boundingBox())!; expect(size.width).toBeGreaterThanOrEqual(44); expect(size.height).toBeGreaterThanOrEqual(44);
  await open(page,'floats');
  const group = page.getByRole('group', { name: '卷宗操作', exact: true });
  const trigger = group.getByRole('button', { name: /^(展开|收起)卷宗操作$/ });
  await expect(trigger).toHaveAccessibleName('展开卷宗操作');
  await trigger.focus();
  await trigger.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(trigger).toHaveAccessibleName('收起卷宗操作');
  await trigger.press('Tab'); const save=page.getByRole('button',{name:'保存草稿',exact:true}); await expect(save).toBeFocused(); await save.press('Escape'); await expect(trigger).toBeFocused(); await expect(save).toBeHidden();
  await trigger.click(); await page.getByRole('button',{name:'查看待办',exact:true}).click(); await expect(page.getByRole('status')).toHaveText('已查看待办');
  const outside=page.getByRole('button',{name:'外部编辑',exact:true}); await outside.click(); await expect(trigger).toHaveAttribute('aria-expanded','false'); await expect(outside).toBeFocused();
  await open(page,'floats','Boundary'); const declined=page.getByRole('button',{name:'展开受控操作',exact:true}); await declined.click(); await declined.click(); await expect(declined).toHaveAttribute('aria-expanded','false'); await expect(page.getByRole('status')).toHaveText('开合请求 2 次，父级保留关闭。');
  await open(page,'float','Boundary','theme:dark;motion:reduced'); await expect(page.getByRole('button',{name:'暂未开放的操作',exact:true})).toBeDisabled();
});

test('switches carousel pages by keyboard while inactive content remains mounted and absent from the tab order', async ({ page }) => {
  await open(page,'carousel'); const carousel=page.getByRole('region',{name:'卷宗轮播',exact:true}); await carousel.getByRole('button',{name:'记录墨关',exact:true}).click();
  const old=await carousel.locator('.ui-carousel__slide').first().elementHandle(); await carousel.focus(); await carousel.press('ArrowRight'); await expect(carousel.getByRole('button',{name:'记录青玉机关',exact:true})).toBeVisible();
  expect(await old!.evaluate(element => ({connected:element.isConnected,hidden:element.hasAttribute('hidden'),inert:element.hasAttribute('inert')}))).toEqual({connected:true,hidden:true,inert:true});
  await expect(carousel.getByRole('button',{name:'记录墨关',exact:true})).toBeHidden(); await carousel.press('End'); await expect(carousel.getByRole('button',{name:'记录绢素经纬',exact:true})).toBeVisible();
  await carousel.press('Home'); await expect(carousel.getByRole('button',{name:'记录墨关',exact:true})).toBeVisible(); await expect(page.getByRole('status')).toHaveText('当前第 1 页，已记录 1 次。'); await old?.dispose();
});

test('pauses carousel autoplay for hover, hidden documents and both reduced-motion sources, then cancels its timer on unmount', async ({ page }) => {
  await page.clock.install({time:new Date('2030-01-01T00:00Z')}); await open(page,'carousel','Boundary','theme:light;motion:standard'); await page.clock.pauseAt(new Date('2030-01-01T01:00Z')); await page.mouse.move(0,0);
  const index=page.getByTestId('carousel-index'), carousel=page.getByRole('region',{name:'自动卷宗轮播',exact:true});
  // Autoplay is already live during bootstrap. Establish a fresh user-controlled
  // interval after the clock is paused, regardless of module loading duration.
  await carousel.focus(); await carousel.press('Home');
  const pause = carousel.getByRole('button',{name:'暂停轮播',exact:true}); if (await pause.count()) await pause.click();
  await carousel.getByRole('button',{name:'播放轮播',exact:true}).click(); await page.getByRole('textbox',{name:'轮播外的草稿',exact:true}).focus(); await page.mouse.move(0,0);
  await page.clock.runFor(1199); await expect(index).toHaveText('当前页 0'); await page.clock.runFor(1); await expect(index).toHaveText('当前页 1');
  await carousel.hover(); await page.clock.runFor(5000); await expect(index).toHaveText('当前页 1'); await page.mouse.move(0,0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}); await page.clock.runFor(5000); await expect(index).toHaveText('当前页 1');
  await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));}); await page.clock.runFor(1200); await expect(index).toHaveText('当前页 2'); await page.clock.runFor(1200); await expect(carousel.getByRole('button',{name:'播放轮播',exact:true})).toBeVisible();
  await carousel.focus(); await carousel.press('Home'); await page.emulateMedia({reducedMotion:'reduce'}); await carousel.getByRole('button',{name:'播放轮播',exact:true}).click(); await page.getByRole('textbox',{name:'轮播外的草稿',exact:true}).focus(); await page.mouse.move(0,0); await page.clock.runFor(5000); await expect(index).toHaveText('当前页 0');
  await page.emulateMedia({reducedMotion:'no-preference'}); await open(page,'carousel','Boundary','theme:dark;motion:reduced'); await page.clock.runFor(5000); await expect(index).toHaveText('当前页 0');
  const retired=await carousel.elementHandle(); await page.getByRole('button',{name:'卸载轮播',exact:true}).click(); await page.clock.runFor(5000); expect(await retired!.evaluate(element=>element.isConnected)).toBe(false); await expect(index).toHaveText('当前页 0'); await retired?.dispose();
});

test('cuts a tour backdrop around actual targets, repositions on resize and handles missing targets or unmount with safe focus return', async ({ page }) => {
  await open(page,'tour'); const trigger=page.getByRole('button',{name:'开始页面导览',exact:true}); await trigger.click(); const modal=page.locator('dialog[open]'); await expect(modal).toHaveAccessibleName('导入你的卷宗');
  await expect.poll(()=>modal.evaluate(element=>getComputedStyle(element,'::backdrop').clipPath)).toContain('polygon'); await expect(page.locator('head style[data-ui-tour-backdrop]')).toHaveCount(1);
  await page.keyboard.press('ArrowRight'); await expect(modal).toHaveAccessibleName('为卷宗命名'); await page.setViewportSize({width:360,height:640}); await inViewport(page,modal);
  await modal.getByRole('button',{name:'上一步',exact:true}).click(); await expect(modal.getByRole('button',{name:'下一步',exact:true})).toBeFocused();
  await page.keyboard.press('Escape'); await expect(modal).toHaveCount(0); await expect(trigger).toBeFocused(); await expect(page.locator('head style[data-ui-tour-backdrop]')).toHaveCount(0);
  await open(page,'tour','Boundary'); const boundary=page.getByRole('button',{name:'打开边界导览',exact:true}); await boundary.click(); await expect(modal).toHaveAccessibleName('未挂载目标'); await expect(modal.getByText('此步骤目标暂不可用，仍可继续或关闭导览。',{exact:true})).toBeVisible();
  await modal.getByRole('button',{name:'下一步',exact:true}).click(); await expect(modal).toHaveAccessibleName('动态目标'); await expect.poll(()=>modal.evaluate(element=>getComputedStyle(element,'::backdrop').clipPath)).toContain('polygon');
  await page.getByRole('button',{name:'切换引导目标',exact:true,includeHidden:true}).evaluate(element=>(element as HTMLButtonElement).click()); await expect(modal.getByText('此步骤目标暂不可用，仍可继续或关闭导览。',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'卸载引导',exact:true,includeHidden:true}).evaluate(element=>(element as HTMLButtonElement).click()); await expect(page.locator('head style[data-ui-tour-backdrop]')).toHaveCount(0); expect(await page.evaluate(()=>document.documentElement.style.overflow)).not.toBe('hidden'); await noOverflow(page);
});

test('paints repeatable text and image watermarks independently and keeps configurable border beams outside readable controls', async ({ page }) => {
  await open(page,'watermark'); const pattern=page.locator('.ui-watermark__pattern'); await expect.poll(()=>pattern.evaluate(element=>getComputedStyle(element).backgroundImage)).toContain('data:image/png');
  const before=await pattern.evaluate(element=>getComputedStyle(element).backgroundImage); const pixel=await pattern.evaluate(async element=>{const url=getComputedStyle(element).backgroundImage.slice(5,-2),image=element.ownerDocument.createElement('img');await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Watermark decode failed'));image.src=url;});const canvas=element.ownerDocument.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d')!;context.drawImage(image,0,0);const data=context.getImageData(0,0,canvas.width,canvas.height).data;let painted=0;for(let i=3;i<data.length;i+=4)if(data[i])painted++;return{painted,total:canvas.width*canvas.height};});
  expect(pixel.painted).toBeGreaterThan(0); expect(pixel.painted).toBeLessThan(pixel.total); await page.getByRole('textbox',{name:'水印下的说明',exact:true}).fill('水印不拦截编辑'); await page.getByRole('button',{name:'更换水印文字',exact:true}).click(); await expect.poll(()=>pattern.evaluate(element=>getComputedStyle(element).backgroundImage)).not.toBe(before);
  await open(page,'watermark','Boundary'); const second=page.locator('.ui-watermark__pattern').nth(1); await expect.poll(()=>second.evaluate(element=>getComputedStyle(element).backgroundImage)).toContain('data:image/png'); const stable=await second.evaluate(element=>getComputedStyle(element).backgroundImage);
  await page.getByRole('button',{name:'切换图片水印来源',exact:true}).click(); await expect(page.getByTestId('watermark-errors')).toHaveText('图片失败 1 次'); await page.getByRole('button',{name:'卸载水印',exact:true}).click(); await page.setViewportSize({width:360,height:800}); await expect(page.locator('.ui-watermark')).toHaveCount(1); expect(await page.locator('.ui-watermark__pattern').evaluate(element=>getComputedStyle(element).backgroundImage)).toBe(stable);
  await page.emulateMedia({reducedMotion:'no-preference'}); await open(page,'beam','Default','theme:dark;motion:standard'); const beams=page.locator('.ui-border-beam__light'); await expect(beams).toHaveCount(2); await expect.poll(()=>beams.first().evaluate(element=>element.getAnimations().length)).toBe(1);
  await page.getByRole('textbox',{name:'流光内的草稿',exact:true}).fill('边框不遮挡文字'); await page.getByRole('button',{name:'校准一次',exact:true}).click(); await expect(page.getByRole('status')).toHaveText('已校准 1 次');
  await page.getByRole('slider',{name:'边框流光数量',exact:true}).press('End'); await expect(beams).toHaveCount(6); await page.emulateMedia({reducedMotion:'reduce'}); await expect.poll(()=>beams.evaluateAll(elements=>elements.every(element=>element.getAnimations().length===0))).toBe(true);
  await page.emulateMedia({reducedMotion:'no-preference'}); await open(page,'beam','Boundary','theme:light;motion:standard'); expect(await page.locator('.ui-border-beam').first().locator('.ui-border-beam__light').evaluateAll(elements=>elements.every(element=>element.getAnimations().length===0))).toBe(true);
  await page.emulateMedia({forcedColors:'active'}); await expect(page.locator('.ui-border-beam__light').first()).toBeHidden(); await noOverflow(page);
});
