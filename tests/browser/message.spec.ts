import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    await use(errors); expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});

async function openStory(page: Page, name: string, globals = 'theme:light;palette:paper;motion:reduced') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const entry = entries.find(item => item.type === 'story' && item.title === '反馈组件/Message 全局提示' && (item.exportName === name || item.id.endsWith(`--${suffix}`)));
  expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

test.describe('Message global feedback', () => {
  test('starts eight pixels from the top, preserves editing focus for three seconds and distinguishes all five feedback types', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
    await openStory(page, 'Default'); await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z'));
    const region = page.getByRole('region', { name: '全局提示', exact: true });
    const draft = page.getByRole('textbox', { name: '全局提示外的草稿', exact: true });
    await draft.fill('提示出现与收起后继续保留的草稿');
    await page.getByRole('button', { name: '显示全局提示', exact: true }).click();
    const message = region.getByRole('group', { name: '操作已完成，可以继续编辑。', exact: true });
    await expect(message).toBeVisible(); await expect(message).toHaveAttribute('data-testid', 'global-message');
    await expect(message.getByRole('button')).toHaveCount(0);
    const box = await message.boundingBox(); expect(box!.y).toBe(8); expect(Math.abs(box!.x + box!.width / 2 - 640)).toBeLessThanOrEqual(1);
    await expect(region.getByRole('status')).toHaveText('操作已完成，可以继续编辑。');
    await expect(region.getByRole('alert')).toBeEmpty();
    await draft.focus(); await page.mouse.move(0, 600); await page.clock.runFor(2999);
    await expect(message).toBeVisible(); await expect(draft).toBeFocused();
    await page.clock.runFor(1); await expect(message).toHaveCount(0); await expect(region.getByRole('status')).toBeEmpty();
    await expect(draft).toBeFocused(); await expect(draft).toHaveValue('提示出现与收起后继续保留的草稿');

    await openStory(page, 'Types');
    const records: { type: string; color: string }[] = [];
    for (const [type, button, text, token] of [
      ['info', '信息', '新的素材已就绪。', 'info'], ['success', '成功', '资料已保存。', 'success'],
      ['warning', '警告', '名称尚未填写完整。', 'warning'], ['error', '错误', '保存未完成，请重试。', 'danger'],
      ['loading', '加载', '正在读取素材，请稍候。', 'info'],
    ]) {
      const trigger = page.getByRole('button', { name: `显示${button}提示`, exact: true }); await trigger.click();
      const current = page.getByRole('region', { name: '全局提示', exact: true }).getByRole('group', { name: text, exact: true });
      await expect(current).toBeVisible(); await expect(trigger).toBeFocused();
      const colors = await current.evaluate((element, token) => {
        const icon = element.querySelector('.ui-toast__seal')!, probe = element.ownerDocument.createElement('span');
        probe.style.color = `var(--ui-color-${token})`; element.append(probe);
        const actual = getComputedStyle(icon).color, expected = getComputedStyle(probe).color; probe.remove(); return { actual, expected };
      }, token);
      expect(colors.actual).toBe(colors.expected); records.push({ type: type!, color: colors.actual });
      const viewport = page.getByRole('region', { name: '全局提示', exact: true });
      await expect(viewport.getByRole(type === 'error' ? 'alert' : 'status')).toHaveText(text!);
      await expect(viewport.getByRole(type === 'error' ? 'status' : 'alert')).toBeEmpty();
      await expect(viewport.getByRole('status')).toHaveCount(1);
      if (type === 'loading') {
        await expect(current.locator('.ui-spinner')).toHaveAttribute('aria-hidden', 'true');
        expect(await current.locator('.ui-spinner').evaluate(element => element.getBoundingClientRect().width)).toBe(18);
      }
    }
    expect(new Set(records.filter(item => item.type !== 'loading').map(item => item.color)).size).toBe(4);
    await page.getByRole('spinbutton', { name: '提示顶部间距', exact: true }).fill('400');
    await page.setViewportSize({ width: 360, height: 320 });
    const clamped = page.getByRole('region', { name: '全局提示', exact: true });
    const limited = await clamped.boundingBox(); expect(limited!.y).toBe(244); expect(limited!.y + limited!.height).toBeLessThanOrEqual(308);
    await clamped.getByRole('button', { name: '关闭提示', exact: true }).click(); await expect(clamped.getByRole('group')).toHaveCount(0);
  });

  test('keeps one live message through loading and success, and supports declined close requests on a narrow reduced-motion screen', async ({ page }) => {
    await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
    await openStory(page, 'Loading'); await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z'));
    const closable = page.getByRole('switch', { name: '显示关闭按钮', exact: true }); await closable.check();
    await page.getByRole('button', { name: '开始操作', exact: true }).click();
    const region = page.getByRole('region', { name: '全局提示', exact: true }), live = region.getByRole('status');
    const loading = region.getByRole('group', { name: '正在整理素材，请稍候。', exact: true });
    await expect(loading).toBeVisible(); await expect(live).toHaveCount(1); await expect(live).toHaveText('正在整理素材，请稍候。');
    const original = await loading.elementHandle();
    await page.mouse.move(0, 600); await page.clock.runFor(6000); await expect(loading).toBeVisible();
    await page.getByRole('button', { name: '完成操作', exact: true }).click();
    const success = region.getByRole('group', { name: '素材已整理完成。', exact: true });
    await expect(success).toBeVisible(); expect(await success.evaluate((element, saved) => element === saved, original)).toBe(true);
    await expect(live).toHaveCount(1); await expect(live).toHaveText('素材已整理完成。');
    await expect(region.getByRole('alert')).toBeEmpty(); await expect(success.locator('.ui-spinner')).toHaveCount(0);
    await page.clock.runFor(900); await success.getByRole('button', { name: '关闭提示', exact: true }).focus();
    await page.clock.runFor(5000); await expect(success).toBeVisible();
    // A parent can remove the currently focused close button without a pointer
    // moving focus first. The remaining lifetime must continue, not reset.
    await closable.evaluate(element => (element as HTMLInputElement).click());
    await expect(success.getByRole('button')).toHaveCount(0);
    const draft = page.getByRole('textbox', { name: '等待期间的草稿', exact: true }); await draft.focus();
    await page.clock.runFor(2099); await expect(success).toBeVisible(); await page.clock.runFor(1);
    await expect(success).toHaveCount(0); await expect(draft).toBeFocused(); await original?.dispose();

    await page.setViewportSize({ width: 360, height: 480 }); await openStory(page, 'LongContent', 'theme:dark;palette:gilt;motion:reduced');
    await page.getByRole('button', { name: '显示长文提示', exact: true }).click();
    const longMessage = page.getByRole('region', { name: '全局提示', exact: true }).getByRole('group');
    const close = longMessage.getByRole('button', { name: '关闭长文提示', exact: true });
    await expect(longMessage).toBeVisible(); expect(await longMessage.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    await page.setViewportSize({ width: 360, height: 240 });
    expect(await longMessage.locator('.ui-toast__content').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    await close.press('Enter'); await expect(page.getByTestId('message-close-requests')).toHaveText('关闭请求：1 次'); await expect(longMessage).toBeVisible();
    await page.setViewportSize({ width: 360, height: 480 }); await page.getByRole('switch', { name: '允许关闭提示', exact: true }).check();
    await close.press('Space'); await expect(longMessage).toHaveCount(0); await expect(page.getByTestId('message-close-requests')).toHaveText('关闭请求：2 次');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);

    await page.emulateMedia({ reducedMotion: 'reduce' }); await openStory(page, 'Loading', 'theme:light;palette:celadon;motion:standard');
    await page.getByRole('button', { name: '开始操作', exact: true }).click();
    const spinner = page.locator('.ui-toast .ui-spinner');
    expect(await spinner.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(page.getByRole('region', { name: '全局提示', exact: true }).getByRole('status')).toHaveCount(1);
  });
});
