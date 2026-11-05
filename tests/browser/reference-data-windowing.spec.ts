import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
async function open(page: Page, family: string, story = 'default', globals = 'theme:dark;motion:reduced') {
  const entries = Object.values((await (await page.request.get('/index.json')).json()).entries) as {title:string;type:string;id:string}[];
  const entry = entries.find(item => item.type === 'story' && item.title === family && item.id.endsWith(`--${story}`)); expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
test('10k virtual rows have bounded DOM, actual index positioning, keyboard selection and resize', async ({ page }) => {
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message)); await open(page,'数据组件/VirtualList 虚拟清单');
  const list=page.getByRole('listbox',{name:'万卷清单',exact:true}); await expect(list.getByRole('option').first()).toHaveAttribute('aria-posinset','1');
  expect(await list.getByRole('option').count()).toBeLessThan(40); await page.getByRole('button',{name:'定位末卷',exact:true}).click();
  await expect(list.getByRole('option').last()).toHaveAttribute('aria-posinset','10000'); expect(await list.evaluate(element=>element.scrollTop)).toBeGreaterThan(430000);
  await list.focus(); await list.press('End'); await list.press('Enter'); await expect(page.locator('[data-virtual-selected]')).toHaveText('选中：record-9999'); await expect(list).toBeFocused();
  await list.press('Home'); await list.press('Enter'); await expect(page.locator('[data-virtual-selected]')).toHaveText('选中：record-0');
  await page.getByRole('button',{name:'改变窗口高度',exact:true}).click(); expect(await list.evaluate(element=>element.clientHeight)).toBe(440); expect(await list.getByRole('option').count()).toBeLessThan(40);
  await page.getByRole('button',{name:'切换虚拟清单',exact:true}).click(); await expect(list).toHaveCount(0); await page.setViewportSize({width:360,height:640});await page.getByRole('textbox',{name:'虚拟清单外的草稿'}).fill('已释放窗口');expect(errors).toEqual([]);
});
test('focused row actions survive a distant window and empty updates remain safe', async ({ page }) => {
  await open(page,'数据组件/VirtualList 虚拟清单','focus-and-empty'); const list=page.getByRole('list',{name:'可操作卷宗',exact:true}), action=list.getByRole('button',{name:'查看卷宗1',exact:true});
  await action.focus(); await list.evaluate(element=>{element.scrollTop=220000;element.dispatchEvent(new Event('scroll'));});
  await expect(action).toBeFocused(); expect(await list.getByRole('listitem').count()).toBeLessThan(40); await expect(list.getByRole('listitem').last()).toHaveAttribute('aria-posinset',/50\d\d/);
  await page.getByRole('button',{name:'切换空清单',exact:true}).click();await expect(list).toContainText('暂无内容');await expect(page.getByRole('button',{name:'切换空清单',exact:true})).toBeFocused();
});
test('virtual tree flattens expanded 10k leaves and retains native tree keyboard and controlled selection', async ({ page }) => {
  await open(page,'数据组件/VirtualTree 虚拟树');const tree=page.getByRole('tree',{name:'万叶目录',exact:true});expect(await tree.getByRole('treeitem').count()).toBeLessThan(40);
  await tree.focus();await tree.press('End');await tree.press('Enter');await expect(page.locator('[data-tree-selected]')).toHaveText('目录选中：record-9999');await expect(tree.getByRole('treeitem').last()).toHaveAttribute('aria-posinset','10000');
  await tree.press('ArrowLeft');await tree.press('ArrowLeft');await expect(tree.getByRole('treeitem')).toHaveCount(1);await expect(tree.getByRole('treeitem')).toHaveAttribute('aria-expanded','false');await expect(tree).toBeFocused();
  await tree.press('ArrowRight');await tree.press('ArrowDown');await tree.press('ArrowDown');await tree.press('Enter');await expect(page.locator('[data-tree-selected]')).toHaveText('目录选中：record-9999');
  await tree.press('ArrowDown');await tree.press('Enter');await expect(page.locator('[data-tree-selected]')).toHaveText('目录选中：record-2');await page.getByRole('textbox',{name:'目录外的草稿'}).focus();await page.getByRole('button',{name:'展开或收拢根目录'}).evaluate(element=>(element as HTMLButtonElement).click());await expect(page.getByRole('textbox',{name:'目录外的草稿'})).toBeFocused();
});
test('List stays semantic while Listy has absolute numbering and keyboard selection at 360px', async ({ page }) => {
  await open(page,'数据组件/List 清单');await expect(page.getByRole('listitem')).toHaveCount(4);await expect(page.getByRole('region',{name:'卷宗目录'})).toContainText('共4份');
  await page.setViewportSize({width:360,height:640});await open(page,'数据组件/Listy 编号清单','default','theme:light;palette:celadon;motion:reduced');const list=page.getByRole('listbox',{name:'编目选择',exact:true});await list.focus();await list.press('End');await list.press('Enter');await expect(page.getByText('选中：record-9999',{exact:true})).toBeVisible();expect(await list.getByRole('option').count()).toBeLessThan(40);await expect(list.getByRole('option').last()).toContainText('10000');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});
