import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const test = base.extend<{ errors: string[] }>({ errors: [async ({ page }, use) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', e => { if (e.type() === 'warning' && e.text().includes('[Vue warn]')) errors.push(e.text()); }); await use(errors); expect(errors).toEqual([]);
}, { auto: true }] });
async function open(page: Page, suffix = 'default', globals = 'theme:light;palette:paper;motion:reduced') {
  const entries = Object.values((await (await page.request.get('/index.json')).json()).entries) as {id:string;title:string;type:string}[];
  const story = entries.find(e => e.type === 'story' && e.title === '基础组件/Form 表单' && e.id.endsWith('--' + suffix)); expect(story).toBeDefined();
  await page.goto('/iframe.html?' + new URLSearchParams({id:story!.id,viewMode:'story',globals})); await page.getByRole('form', {name:'档案登记表单',exact:true}).waitFor();
}
async function fill(page: Page, code = 'archive-01', confirm = code) {
  await page.getByRole('textbox',{name:'档案名称',exact:true}).fill('观山设计档案');
  await page.getByRole('textbox',{name:'档案编号',exact:true}).fill(code);
  await page.getByRole('textbox',{name:'确认编号',exact:true}).fill(confirm);
}
test.describe('Form validation and field bindings', () => {
  test('collects field errors, links labels and native validity, focuses the first error and accepts only a validated cross-field model', async ({page}) => {
    await open(page); const form=page.getByRole('form',{name:'档案登记表单',exact:true}), submit=page.getByRole('button',{name:'核对并登记',exact:true});
    const name=page.getByRole('textbox',{name:'档案名称',exact:true}), code=page.getByRole('textbox',{name:'档案编号',exact:true}), confirm=page.getByRole('textbox',{name:'确认编号',exact:true});
    await submit.click(); await expect(name).toBeFocused(); await expect(name).toHaveAttribute('aria-invalid','true');
    const summary=page.getByRole('region',{name:'表单校验结果',exact:true}); await expect(summary.getByRole('button')).toHaveCount(3);
    expect(await name.evaluate(el=>el.getAttribute('aria-describedby')?.split(/\s+/).some(id=>document.getElementById(id)?.textContent==='请填写档案名称。'))).toBe(true);
    await summary.getByRole('button',{name:'档案编号：请填写档案编号。',exact:true}).click(); await expect(code).toBeFocused();
    await fill(page,'a?','a?'); await submit.click(); await expect(code).toBeFocused(); await expect(code).toHaveAttribute('aria-invalid','true');
    await fill(page,'archive-01','wrong'); await submit.click(); await expect(confirm).toBeFocused(); await expect(confirm).toHaveAttribute('aria-invalid','true');
    await fill(page); const email=page.getByRole('textbox',{name:'联系邮箱',exact:true}); await email.fill('invalid-address'); await submit.click(); await expect(email).toBeFocused(); await expect(email).toHaveAttribute('aria-invalid','true');
    await email.fill('archive@example.test'); await submit.click(); await expect(page.getByRole('status')).toHaveText('已登记 1 次：观山设计档案'); await expect(submit).toBeFocused();
    await expect(summary).toHaveCount(0); await expect(form).not.toHaveAttribute('aria-busy','true');
    const values=await form.evaluate(el=>[...new FormData(el as HTMLFormElement).entries()]); expect(values).toContainEqual(['name','观山设计档案']); expect(values).toContainEqual(['code','archive-01']);
  });
  test('aborts stale async validation on editing and reset, coalesces submit and never turns a rejected or cancelled check into a saved record', async ({page}) => {
    await page.clock.install({time:new Date('2030-01-01T00:00Z')}); await open(page); await page.clock.pauseAt(new Date('2030-01-01T01:00Z'));
    const form=page.getByRole('form',{name:'档案登记表单',exact:true}), submit=page.getByRole('button',{name:'核对并登记',exact:true});
    await fill(page,'taken'); await submit.click(); await expect(form).toHaveAttribute('aria-busy','true'); await page.clock.runFor(401);
    await expect(page.getByRole('textbox',{name:'档案编号',exact:true})).toHaveAttribute('aria-invalid','true'); await expect(page.getByRole('status')).toHaveText('已登记 0 次');
    await fill(page,'archive-02'); await form.evaluate(el=>{el.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true}));el.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true}));});
    await page.getByRole('textbox',{name:'档案编号',exact:true}).fill('archive-03'); await page.clock.runFor(1000); await expect(page.getByRole('status')).toHaveText('已登记 0 次');
    await fill(page,'archive-04'); await submit.click(); await expect(form).toHaveAttribute('aria-busy','true');
    await page.getByRole('button',{name:'恢复初始资料',exact:true}).click(); await page.clock.runFor(1000);
    await expect(page.getByRole('textbox',{name:'档案名称',exact:true})).toHaveValue(''); await expect(page.getByRole('region',{name:'表单校验结果',exact:true})).toHaveCount(0); await expect(page.getByRole('status')).toHaveText('已登记 0 次');
    await fill(page); await form.evaluate(el=>{el.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true}));el.dispatchEvent(new SubmitEvent('submit',{bubbles:true,cancelable:true}));}); await page.clock.runFor(401);
    await expect(page.getByRole('status')).toHaveText('已登记 1 次：观山设计档案');
  });
  test('keeps IME drafts quiet until composition ends and validates on change or blur without replacing the input', async ({page}) => {
    await open(page,'change-validation'); const name=page.getByRole('textbox',{name:'档案名称',exact:true});
    await name.evaluate(el=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));(el as HTMLInputElement).value='观';el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true,data:'观'}));});
    await expect(name).toHaveValue('观'); await expect(name).not.toHaveAttribute('aria-invalid','true');
    await name.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'观'})));
    await expect(name).toHaveAttribute('aria-invalid','true');
    await name.fill('观山'); await expect(name).not.toHaveAttribute('aria-invalid','true');
    await open(page,'blur-validation'); const next=page.getByRole('textbox',{name:'档案名称',exact:true}); await next.fill('观'); await page.getByRole('textbox',{name:'档案编号',exact:true}).focus(); await expect(next).toHaveAttribute('aria-invalid','true');
  });
  test('keeps disabled forms native and fits long validation errors in four materials at 360px', async ({page}) => {
    await open(page,'disabled'); await expect(page.getByRole('textbox',{name:'档案名称',exact:true})).toBeDisabled(); await expect(page.getByRole('button',{name:'核对并登记',exact:true})).toBeDisabled();
    await page.setViewportSize({width:360,height:700});
    for(const globals of ['theme:light;palette:paper;motion:reduced','theme:light;palette:celadon;motion:reduced','theme:light;palette:gilt;motion:reduced','theme:dark;motion:reduced']) {
      await open(page,'default',globals); await page.getByRole('button',{name:'核对并登记',exact:true}).click(); await expect(page.getByRole('region',{name:'表单校验结果',exact:true})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);
    }
  });
  test('keeps a class model editable after validation, fails closed, preserves external focus and releases composition guards on removal and reset', async ({page}) => {
    await page.clock.install({time:new Date('2030-01-01T00:00Z')}); await open(page,'field-lifecycle'); await page.clock.pauseAt(new Date('2030-01-01T01:00Z'));
    const submit=page.getByRole('button',{name:'核对并登记',exact:true}), outside=page.getByRole('textbox',{name:'表单外的草稿',exact:true});
    await fill(page,'error'); await submit.click(); await outside.focus(); await page.clock.runFor(401);
    await expect(outside).toBeFocused(); await expect(page.getByRole('textbox',{name:'档案编号',exact:true})).toHaveAttribute('aria-invalid','true'); await expect(page.getByRole('status')).toHaveText('已登记 0 次');
    await expect(page.getByRole('region',{name:'表单校验结果',exact:true})).toContainText('校验未完成');
    await fill(page); const name=page.getByRole('textbox',{name:'档案名称',exact:true}); await name.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true})));
    await page.getByRole('button',{name:'切换名称字段',exact:true}).evaluate(el=>(el as HTMLButtonElement).click()); await expect(name).toHaveCount(0);
    await submit.click(); await page.clock.runFor(401); await expect(page.getByRole('status')).toContainText('已登记 1 次');
    await page.getByRole('button',{name:'切换名称字段',exact:true}).click(); await name.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true})));
    await page.getByRole('form',{name:'档案登记表单',exact:true}).evaluate(el=>(el as HTMLFormElement).reset()); await submit.click(); await expect(name).toHaveAttribute('aria-invalid','true');
  });
});
