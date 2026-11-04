import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as Vue from 'vue';
import { parse, compileScript } from 'vue/compiler-sfc';
import { renderToString } from 'vue/server-renderer';
import ts from 'typescript';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); }); await use(errors); expect(errors).toEqual([]); }, { auto: true }],
});
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:dark;motion:standard') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const entry = entries.find(item => item.type === 'story' && item.title === '基础组件/Skeleton 骨架屏' && (item.exportName === exportedName || item.id.endsWith(`--${suffix}`))); expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
function sourceComponent(name: 'MSkeleton' | 'MSpinner') {
  const filename = fileURLToPath(new URL(`../../src/components/${name}.vue`, import.meta.url));
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: `${name}-ssr-contract`, inlineTemplate: true, fs: { fileExists: existsSync, readFile: path => readFileSync(path, 'utf8') } });
  const code = ts.transpileModule(script.content, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports: Record<string, unknown> = {};
  new Function('require', 'exports', code)((dependency: string) => { if (dependency === 'vue') return Vue; throw new Error(`Unexpected feedback dependency: ${dependency}`); }, exports);
  return exports.default as Vue.Component;
}
async function texture(line: Locator) { return line.evaluate(element => ['::before', '::after'].map(pseudo => { const style = getComputedStyle(element, pseudo); return { animation: style.animationName, background: style.backgroundImage, position: style.backgroundPosition, transform: style.transform, opacity: Number(style.opacity) }; })); }
async function frames(page: Page) { await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); }

test.describe('Pixel ink skeleton', () => {
  test('preserves line geometry and deterministic server rendering without a motion dependency', async ({ page }) => {
    const skeletonComponent = sourceComponent('MSkeleton');
    const ssr = () => renderToString(Vue.createSSRApp(skeletonComponent, { lines: 3 }));
    expect(await ssr()).toBe(await ssr());
    expect(await ssr()).toContain('aria-hidden="true"');
    expect((await ssr()).match(/class="ui-skeleton__line"/g)).toHaveLength(3);
    const spinnerComponent = sourceComponent('MSpinner');
    const spinnerSSR = () => renderToString(Vue.createSSRApp(spinnerComponent, { label: '加载中', size: 'md' }));
    expect(await spinnerSSR()).toBe(await spinnerSSR()); expect((await spinnerSSR()).match(/<svg/g)).toHaveLength(1);
    await openStory(page, 'LineCounts');
    for (const [sample, expected] of Object.entries({ single: 1, fraction: 2, minimum: 1, maximum: 12, fallback: 3 })) await expect(page.locator(`[data-skeleton-case="${sample}"] .ui-skeleton__line`)).toHaveCount(expected);
    await openStory(page); const skeleton = page.locator('.ui-skeleton'), lines = skeleton.locator('.ui-skeleton__line');
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true'); await expect(lines).toHaveCount(3); await expect(page.getByRole('status')).toHaveCount(0);
    const sizes = await lines.evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
    expect(sizes[1]!.width / sizes[0]!.width).toBeCloseTo(.86, 2); expect(sizes[2]!.width / sizes[0]!.width).toBeCloseTo(.68, 2);
    expect(sizes.every(size => size.height === sizes[0]!.height && size.height > 0)).toBe(true);
  });

  test('keeps snow and soft local echoes separate with a gentle envelope while the line box stays still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page);
    const lines = page.locator('.ui-skeleton__line'), first = lines.first();
    await expect.poll(() => first.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(2);
    const time = await first.evaluate(element => element.getAnimations({ subtree: true })[0]!.currentTime as number); await frames(page);
    expect(await first.evaluate(element => element.getAnimations({ subtree: true })[0]!.currentTime as number)).toBeGreaterThan(time);
    const delays = await lines.evaluateAll(elements => elements.map(element => getComputedStyle(element, '::before').animationDelay)); expect(new Set(delays).size).toBeGreaterThan(1);
    const before = await first.boundingBox();
    await first.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => { animation.pause(); animation.currentTime = 0; })); const initial = await texture(first);
    await first.evaluate(element => element.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 1400; })); const displaced = await texture(first);
    expect(displaced).not.toEqual(initial); expect(displaced.every(layer => layer.background !== 'none' && !layer.background.includes('repeating-'))).toBe(true);
    expect(displaced[0]!.opacity).toBeGreaterThan(0); expect(displaced[0]!.opacity).toBeLessThan(.25);
    expect(displaced[1]!.opacity).toBeGreaterThanOrEqual(.08); expect(displaced[1]!.opacity).toBeLessThanOrEqual(.26);
    expect(await first.evaluate(element => getComputedStyle(element, '::after').backgroundRepeat.split(',').every(value => value.trim() === 'no-repeat'))).toBe(true);
    const envelope = await first.evaluate(element => {
      const animationName = getComputedStyle(element, '::after').animationName;
      const echo = element.getAnimations({ subtree: true }).find(animation => (animation as CSSAnimation).animationName === animationName)!;
      const duration = Number(echo.effect!.getTiming().duration), samples: number[] = [];
      echo.pause();
      for (let time = 0; time <= duration; time += 100) { echo.currentTime = time; samples.push(Number(getComputedStyle(element, '::after').opacity)); }
      const style = getComputedStyle(element, '::after');
      return { samples, maximumStep: Math.max(...samples.slice(1).map((value, index) => Math.abs(value - samples[index]!))), clip: style.clipPath,
        sizes: style.backgroundSize.split(',').map(value => value.trim().split(/\s+/).map(parseFloat)) };
    });
    expect(Math.min(...envelope.samples)).toBeGreaterThanOrEqual(.08); expect(Math.max(...envelope.samples)).toBeLessThanOrEqual(.26);
    expect(envelope.maximumStep).toBeLessThan(.04); expect(envelope.clip).toBe('none');
    expect(envelope.sizes.every(([width, height]) => width! <= 26 && height! <= 2)).toBe(true);
    expect(await first.boundingBox()).toEqual(before); expect(await first.evaluate(element => getComputedStyle(element).opacity)).toBe('1');
    expect(await first.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    expect(await first.evaluate(element => getComputedStyle(element).overflow)).toBe('hidden');
  });

  test('retains static texture for both reduced-motion sources and forced colors', async ({ page }) => {
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' });
      await openStory(page, 'Default', `theme:${source === 'system' ? 'dark' : 'light'};motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const first = page.locator('.ui-skeleton__line').first();
      expect((await texture(first)).every(layer => layer.animation === 'none' && layer.background !== 'none' && layer.transform === 'none')).toBe(true);
      expect(await first.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' }); await openStory(page);
    const first = page.locator('.ui-skeleton__line').first(); expect(await first.evaluate(element => getComputedStyle(element).borderTopStyle)).toBe('solid');
    expect((await texture(first)).every(layer => layer.animation === 'none' && layer.background !== 'none')).toBe(true);
  });

  test('composes media at 360px and lets one parent busy message own repeated content replacement', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true }); const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      for (const profile of ['theme:light;palette:paper', 'theme:light;palette:celadon', 'theme:light;palette:gilt', 'theme:dark;palette:paper']) { await openStory(page, 'Compositions', `${profile};motion:standard`); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360); expect(await page.locator('.ui-skeleton__line').evaluateAll(elements => elements.every(element => element.getBoundingClientRect().left >= 0 && element.getBoundingClientRect().right <= 360))).toBe(true); }
      await openStory(page, 'ContentReplacement'); const region = page.getByRole('region', { name: '最近整理', exact: true });
      await expect(region).toHaveAttribute('aria-busy', 'true'); await expect(page.getByRole('status')).toHaveCount(1); await expect(page.getByRole('status')).toHaveText('内容正在载入。');
      const retired = await region.locator('.ui-skeleton__line').first().evaluateHandle(element => element);
      await page.getByRole('button', { name: '显示实际内容', exact: true }).click();
      await expect(region).toHaveAttribute('aria-busy', 'false'); await expect(region.locator('.ui-skeleton')).toHaveCount(0); await expect(page.getByRole('status')).toHaveText('内容已准备好。');
      await expect(page.getByRole('button', { name: '显示骨架占位', exact: true })).toBeFocused();
      await expect.poll(() => retired.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0); await retired.dispose();
      for (let cycle = 0; cycle < 2; cycle++) { await page.getByRole('button', { name: '显示骨架占位', exact: true }).click(); await expect(page.getByRole('status')).toHaveCount(1); await page.getByRole('button', { name: '显示实际内容', exact: true }).click(); }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360); expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
