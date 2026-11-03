import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text());
    });
    await use(errors);
    expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});

type StoryEntry = { id: string; title: string; type: string; exportName?: string };

async function openStory(page: Page, title: string, exportedName = 'Default', globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, StoryEntry> };
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === title
    && (entry.exportName === exportedName || entry.id.endsWith(`--${suffix}`)));
  expect(story, `${title}/${exportedName} exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

const cardTitle = '基础组件/Card 卡片';
const toastTitle = '基础组件/Toast 轻提示';

async function openTimedToast(page: Page, exportedName = 'Default') {
  // Install before Storybook runs any timer; freeze only once the story is ready.
  await page.clock.install({ time: new Date('2030-01-01T00:00:00Z') });
  await openStory(page, toastTitle, exportedName);
  await page.clock.pauseAt(new Date('2030-01-01T01:00:00Z'));
}

async function expectNoPageOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(geometry.scroll).toBe(geometry.viewport);
}

test.describe('Card', () => {
  test('uses a labelled static article and omits empty headings, slots and ARIA references', async ({ page }) => {
    await openStory(page, cardTitle);
    const card = page.getByRole('article', { name: '观山 · 设计档案', exact: true });
    const heading = card.getByRole('heading', { name: '观山 · 设计档案', level: 3, exact: true });
    await expect(card).toHaveAttribute('aria-labelledby', (await heading.getAttribute('id'))!);
    const description = await card.getAttribute('aria-describedby');
    await expect(card.locator(`[id="${description}"]`)).toHaveText('让内容有层次，让操作有自己的位置。');
    expect(await card.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
    await expect(card).not.toHaveAttribute('role', 'button');
    await openStory(page, cardTitle, 'ContentOnly');
    const contentOnly = page.getByRole('article');
    await expect(contentOnly.getByRole('heading')).toHaveCount(0);
    await expect(contentOnly).not.toHaveAttribute('aria-labelledby');
    await expect(contentOnly).not.toHaveAttribute('aria-describedby');
    await expect(contentOnly.locator('header, footer')).toHaveCount(0);
    await openStory(page, cardTitle, 'EmptySlots');
    const emptySlots = page.getByRole('article');
    await expect(emptySlots.locator('header, footer')).toHaveCount(0);
    await expect(emptySlots).not.toHaveAttribute('aria-labelledby');
    await expect(emptySlots).not.toHaveAttribute('aria-describedby');
    await expect(emptySlots).not.toContainText('由空 header 插槽接管');
  });

  test('lets custom headings and inner input, button and link keep their own semantics and keyboard actions', async ({ page }) => {
    await openStory(page, cardTitle, 'WithActions');
    const card = page.getByRole('region', { name: '一份正在生长的档案', exact: true });
    const heading = card.getByRole('heading', { name: '一份正在生长的档案', level: 2, exact: true });
    await expect(card).toHaveAttribute('aria-labelledby', (await heading.getAttribute('id'))!);
    await expect(card).not.toHaveAttribute('aria-describedby');
    await expect(card).not.toContainText('此默认标题由插槽替换');
    const input = card.getByLabel('档案名称');
    await input.fill('键盘操作档案');
    await input.focus();
    await page.keyboard.press('Tab');
    const save = card.getByRole('button', { name: '保存档案', exact: true });
    await expect(save).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card.getByRole('status')).toHaveText('「键盘操作档案」已在当前预览中保存。');
    await page.keyboard.press('Tab');
    const link = card.getByRole('link', { name: '查看说明', exact: true });
    await expect(link).toBeFocused();
    const target = await link.getAttribute('href');
    await page.keyboard.press('Enter');
    expect(new URL(page.url()).hash).toBe(target);
    await expect(input).toHaveValue('键盘操作档案');
    expect(await card.evaluate(element => (element as HTMLElement).tabIndex)).toBe(-1);
  });

  test('wraps long headings and uninterrupted content on a 360px page without truncating them', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await openStory(page, cardTitle, 'LongContent', 'theme:dark;motion:reduced');
    const heading = page.getByRole('heading', { level: 2 });
    await expect(heading).toHaveText('ArchiveWithoutArtificialTruncationOrFixedHeight'.repeat(3));
    const code = page.locator('.ui-card code');
    await expect(code).toHaveText('https://example.test/archives/' + 'continuous-reference-'.repeat(18));
    for (const element of [heading, code]) {
      expect(await element.evaluate(node => node.scrollWidth <= node.clientWidth || getComputedStyle(node).display === 'inline')).toBe(true);
      await expect(element).not.toHaveCSS('text-overflow', 'ellipsis');
    }
    await expectNoPageOverflow(page);
  });
});

test.describe('Toast', () => {
  test('announces one complete message without the dismiss control and leaves the current task focused', async ({ page }) => {
    await openStory(page, toastTitle);
    const input = page.getByLabel('通知外输入框');
    await input.fill('未完成的编辑');
    await input.focus();
    // A notification can arrive while the user is editing, without a pointer gesture.
    await page.getByRole('button', { name: '显示保存通知', exact: true }).evaluate(element => (element as HTMLElement).click());
    const notification = page.getByRole('group', { name: '设置已保存', exact: true });
    await expect(notification).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('未完成的编辑');
    await expect(notification).not.toHaveAttribute('aria-live');
    const message = '设置已保存 新的配置已经应用，可以继续创作。';
    await expect(page.getByRole('status')).toHaveText(message);
    await expect(page.getByRole('alert')).toBeEmpty();
    const announcements = await page.locator('[aria-live]').allTextContents();
    expect(announcements.map(value => value.trim()).filter(Boolean)).toEqual([message]);
    const titleId = await notification.getAttribute('aria-labelledby');
    const descriptionId = await notification.getAttribute('aria-describedby');
    await expect(notification.locator(`[id="${titleId}"]`)).toHaveText('设置已保存');
    await expect(notification.locator(`[id="${descriptionId}"]`)).toHaveText('新的配置已经应用，可以继续创作。');
    const close = notification.getByRole('button', { name: '关闭通知', exact: true });
    await close.focus();
    await close.press('Enter');
    await expect(notification).toHaveCount(0);
    await expect(page.getByRole('status')).toBeEmpty();
    await expect(input).toHaveValue('未完成的编辑');
  });

  test('uses the full default reading time and dismisses once the 5000ms deadline is reached', async ({ page }) => {
    await openTimedToast(page);
    const trigger = page.getByRole('button', { name: '显示保存通知', exact: true });
    await trigger.click();
    const notification = page.getByRole('group', { name: '设置已保存', exact: true });
    await expect(notification).toBeVisible();
    await expect(trigger).toBeFocused();
    await page.clock.runFor(4999);
    await expect(notification).toBeVisible();
    await page.clock.runFor(1);
    await expect(notification).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('resumes only the remaining time after both hover and keyboard focus have ended', async ({ page }) => {
    await openTimedToast(page, 'Pause');
    await page.getByRole('button', { name: '显示暂停示例', exact: true }).click();
    const notification = page.getByRole('group', { name: '暂停中的通知', exact: true });
    await expect(notification).toBeVisible();
    await page.clock.runFor(400);
    await notification.hover();
    await notification.getByRole('button', { name: '关闭通知', exact: true }).focus();
    await page.clock.runFor(4000);
    await expect(notification).toBeVisible();
    await page.mouse.move(4, 4);
    await page.clock.runFor(4000);
    await expect(notification).toBeVisible();
    await page.getByLabel('通知外输入框').focus();
    await page.clock.runFor(799);
    await expect(notification).toBeVisible();
    await page.clock.runFor(1);
    await expect(notification).toHaveCount(0);
    await expect(page.getByLabel('通知外输入框')).toBeFocused();
  });

  test('pauses a hidden document and resumes its remaining reading time when visible again', async ({ page }) => {
    await openTimedToast(page, 'Pause');
    await page.getByRole('button', { name: '显示暂停示例', exact: true }).click();
    const notification = page.getByRole('group', { name: '暂停中的通知', exact: true });
    await expect(notification).toBeVisible();
    const setHidden = (hidden: boolean) => page.evaluate(value => {
      // Headless Chromium does not expose a reliable tab-background action.
      Object.defineProperty(document, 'hidden', { configurable: true, value });
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: value ? 'hidden' : 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
    try {
      await page.clock.runFor(300);
      await setHidden(true);
      await page.clock.runFor(6000);
      await expect(notification).toBeVisible();
      await setHidden(false);
      await page.clock.runFor(899);
      await expect(notification).toBeVisible();
      await page.clock.runFor(1);
      await expect(notification).toHaveCount(0);
    } finally {
      await page.evaluate(() => {
        Reflect.deleteProperty(document, 'hidden');
        Reflect.deleteProperty(document, 'visibilityState');
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
  });

  test('keeps duration=0 and default error messages readable with one live announcement per notification', async ({ page }) => {
    await openTimedToast(page, 'Variants');
    await page.getByRole('button', { name: '显示三种通知', exact: true }).click();
    const messages = [
      ['资料已就绪', '资料已就绪 可以开始查看新的设计资料。'],
      ['草稿已归档', '草稿已归档 这一次创作已经留存。'],
      ['保存未完成', '保存未完成 请检查连接后重试，已填写内容仍保留。'],
    ];
    await expect(page.getByRole('group')).toHaveCount(3);
    for (const [title, message] of messages) {
      const notification = page.getByRole('group', { name: title, exact: true });
      await expect(notification).toBeVisible();
      await expect(notification).not.toHaveAttribute('aria-live');
      const live = notification.locator('..').locator('[aria-live]');
      await expect.poll(async () => (await live.allTextContents()).map(value => value.trim()).filter(Boolean)).toEqual([message]);
      await expect(live.filter({ hasText: message })).toHaveAttribute('role', title === '保存未完成' ? 'alert' : 'status');
    }
    await page.clock.runFor(60_000);
    await expect(page.getByRole('group')).toHaveCount(3);
    await page.getByRole('group', { name: '草稿已归档', exact: true }).getByRole('button', { name: '关闭通知', exact: true }).click();
    await expect(page.getByRole('group')).toHaveCount(2);
    await expect(page.getByRole('group', { name: '资料已就绪', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: '保存未完成', exact: true })).toBeVisible();
  });

  test('requests expiration once when a parent declines it and allows later manual retries and a fresh opening', async ({ page }) => {
    await openTimedToast(page, 'Controlled');
    await page.getByRole('button', { name: '显示受控通知', exact: true }).click();
    const notification = page.getByRole('group', { name: '等待页面确认', exact: true });
    const requests = page.getByTestId('toast-close-requests');
    await page.clock.runFor(649);
    await expect(requests).toHaveText('关闭请求：0 次');
    await page.clock.runFor(1);
    await expect(requests).toHaveText('关闭请求：1 次');
    await expect(notification).toBeVisible();
    await page.clock.runFor(10_000);
    await expect(requests).toHaveText('关闭请求：1 次');
    const close = notification.getByRole('button', { name: '关闭通知', exact: true });
    await close.click();
    await expect(requests).toHaveText('关闭请求：2 次');
    await close.press('Enter');
    await expect(requests).toHaveText('关闭请求：3 次');
    await close.evaluate(element => (element as HTMLElement).click());
    await expect(requests).toHaveText('关闭请求：4 次');
    await page.getByRole('button', { name: '接受关闭请求', exact: true }).click();
    await expect(notification).toHaveCount(0);
    await page.getByRole('button', { name: '清零并重开', exact: true }).click();
    await expect(notification).toBeVisible();
    await expect(requests).toHaveText('关闭请求：0 次');
    await page.clock.runFor(650);
    await expect(requests).toHaveText('关闭请求：1 次');
  });

  test('gives replacement content a full new reading time while keeping an existing hover pause', async ({ page }) => {
    await openTimedToast(page, 'Replacement');
    await page.getByRole('button', { name: '显示可替换通知', exact: true }).click();
    const first = page.getByRole('group', { name: '第一条消息', exact: true });
    await expect(first).toBeVisible();
    await page.clock.runFor(900);
    await first.hover();
    // Update from outside without moving the pointer off the reading area.
    await page.getByRole('button', { name: '替换当前消息', exact: true }).evaluate(element => (element as HTMLElement).click());
    const replacement = page.getByRole('group', { name: '第2条消息', exact: true });
    await expect(replacement).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('第2条消息 当前消息编号：2');
    await page.clock.runFor(5000);
    await expect(replacement).toBeVisible();
    await page.mouse.move(4, 4);
    await page.clock.runFor(1199);
    await expect(replacement).toBeVisible();
    await page.clock.runFor(1);
    await expect(replacement).toHaveCount(0);
  });

  test('isolates concurrent timers and cleans an unmounted instance before a fresh mount starts', async ({ page }) => {
    await openTimedToast(page, 'Multiple');
    await page.getByRole('button', { name: '同时显示两条通知', exact: true }).click();
    const first = page.getByRole('group', { name: '归档已完成', exact: true });
    const second = page.getByRole('group', { name: '资料处理中', exact: true });
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    await first.hover();
    await page.clock.runFor(1600);
    await expect(first).toBeVisible();
    await expect(second).toHaveCount(0);
    await page.mouse.move(4, 4);
    await page.clock.runFor(899);
    await expect(first).toBeVisible();
    await page.clock.runFor(1);
    await expect(first).toHaveCount(0);

    await page.clock.resume();
    await openStory(page, toastTitle, 'UnmountCleanup');
    await page.clock.pauseAt(new Date('2030-01-01T02:00:00Z'));
    await page.getByRole('button', { name: '显示可卸载通知', exact: true }).click();
    const temporary = page.getByRole('group', { name: '等待中的临时通知', exact: true });
    await expect(temporary).toBeVisible();
    await page.clock.runFor(300);
    await page.getByRole('button', { name: '卸载当前通知', exact: true }).click();
    await expect(temporary).toHaveCount(0);
    await page.clock.runFor(3000);
    const requests = page.getByTestId('toast-unmount-requests');
    await expect(requests).toHaveText('关闭请求：0 次');
    await page.getByRole('button', { name: '重新挂载通知', exact: true }).click();
    await expect(temporary).toBeVisible();
    await page.clock.runFor(649);
    await expect(temporary).toBeVisible();
    await page.clock.runFor(1);
    await expect(temporary).toHaveCount(0);
    await expect(requests).toHaveText('关闭请求：1 次');
  });
});

test.describe('Toast on touch displays', () => {
  test.use({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true });

  test('inherits local themes, reduces motion and keeps a long top-end message and a 44px close action within reach', async ({ page }) => {
    for (const theme of ['light', 'dark']) {
      await openStory(page, toastTitle, 'LongContent', `theme:${theme};motion:reduced`);
      await page.getByRole('button', { name: '显示长消息', exact: true }).click();
      const viewport = page.getByRole('region', { name: '阅读通知', exact: true });
      const notification = viewport.getByRole('group');
      await expect(notification).toBeVisible();
      expect(await notification.evaluate(element => element.closest('[data-ui-theme]')?.getAttribute('data-ui-theme'))).toBe(theme);
      expect(await viewport.evaluate(element => element.getBoundingClientRect().top < innerHeight / 2)).toBe(true);
      const themeColors = await notification.evaluate(element => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--ui-color-text)';
        element.closest('[data-ui-theme]')!.append(probe);
        const inherited = getComputedStyle(probe).color;
        probe.remove();
        return { inherited, actual: getComputedStyle(element).color };
      });
      expect(themeColors.actual).toBe(themeColors.inherited);
      const close = notification.getByRole('button', { name: '关闭通知', exact: true });
      const box = await close.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      await expect(close).toBeInViewport({ ratio: 1 });
      const styles = await notification.evaluate(element => {
        const notificationStyle = getComputedStyle(element);
        const closeStyle = getComputedStyle(element.querySelector('button')!);
        return { animation: notificationStyle.animationName, transition: closeStyle.transitionDuration };
      });
      expect(styles.animation).toBe('none');
      expect(styles.transition.split(',').every(value => parseFloat(value) === 0)).toBe(true);
      const content = notification.locator('.ui-toast__content');
      expect(await content.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
      await content.evaluate(element => element.scrollTo(0, element.scrollHeight));
      await expect(close).toBeInViewport({ ratio: 1 });
      await expectNoPageOverflow(page);
      await close.tap();
      await expect(notification).toHaveCount(0);
    }
  });
});
