import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    await use(errors);
    expect(errors, 'No browser errors or Vue warnings').toEqual([]);
  }, { auto: true }],
});

type StoryEntry = { id: string; title: string; type: string; exportName?: string };
type Sequence = { title: string; region: string; slider: string; play: string; pause: string; reduced: string; duration: number; midpoint: number };

async function openStory(page: Page, title: string, globals = 'theme:dark;motion:standard') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const entries = (await response.json() as { entries: Record<string, StoryEntry> }).entries;
  const story = Object.values(entries).find(entry => entry.type === 'story' && entry.title === title && (entry.exportName === 'Default' || entry.id.endsWith('--default')));
  expect(story, `${title}/Default exists`).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(story!.id)}&viewMode=story&globals=${globals}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

async function exerciseControls(page: Page, config: Sequence) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openStory(page, config.title);
  const sequence = page.getByRole('region', { name: config.region, exact: true });
  const progress = sequence.getByRole('slider', { name: config.slider, exact: true });
  const play = sequence.getByRole('button', { name: config.play, exact: true });
  const pause = sequence.getByRole('button', { name: config.pause, exact: true });
  const replay = sequence.getByRole('button', { name: '重新播放', exact: true });

  await expect(progress).toHaveValue('0');
  await play.click();
  await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0.05);
  await pause.click();
  const held = await progress.inputValue();
  await page.waitForTimeout(180);
  await expect(progress).toHaveValue(held);

  await progress.fill(String(config.midpoint));
  await expect(progress).toHaveValue(String(config.midpoint));
  await expect(play).toBeVisible();
  await play.click();
  await expect(pause).toBeVisible();
  await progress.focus();
  await progress.press('End');
  await expect(progress).toHaveValue(String(config.duration));
  await expect(play).toBeVisible();
  await page.waitForTimeout(180);
  await expect(progress).toHaveValue(String(config.duration));
  await progress.press('ArrowLeft');
  await expect(progress).toHaveValue(String(Number((config.duration - 0.01).toFixed(2))));
  await expect(play).toBeVisible();
  await replay.click();
  await expect(pause).toBeVisible();
  await expect.poll(async () => Number(await progress.inputValue())).toBeLessThan(config.duration);
  await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0);
  await pause.click();

  for (const source of ['container', 'system']) {
    await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
    await openStory(page, config.title, `theme:dark;motion:${source === 'container' ? 'reduced' : 'standard'}`);
    const staticPlay = sequence.getByRole('button', { name: config.reduced, exact: true });
    await expect(staticPlay).toBeVisible();
    await progress.fill(String(config.midpoint));
    await expect(progress).toHaveValue(String(config.midpoint));
    await staticPlay.click();
    await expect(progress).toHaveValue(String(config.duration));
    await replay.click();
    await page.waitForTimeout(180);
    await expect(progress).toHaveValue(String(config.duration));
    await expect(pause).toHaveCount(0);
  }
}

test.describe('Shared controls in motion examples', () => {
  test('Orbit supports playback, keyboard endpoint seeking, replay and static reduced motion', async ({ page }) => {
    await exerciseControls(page, { title: '动效/MG 轨道构形', region: 'GSAP 轨道构形编排', slider: 'MG 编排进度', play: '播放', pause: '暂停', reduced: '查看完成状态', duration: 4.8, midpoint: 2.4 });
  });

  test('Ink supports playback, keyboard endpoint seeking, replay and static reduced motion', async ({ page }) => {
    await exerciseControls(page, { title: '动效/MG 墨迹切面', region: '墨迹切面 GSAP 动画编排', slider: '墨迹切面动画进度', play: '播放动画', pause: '暂停动画', reduced: '查看落印状态', duration: 5, midpoint: 2.5 });
  });
});
