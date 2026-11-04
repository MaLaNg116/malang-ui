import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => { const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); }); await use(errors); expect(errors).toEqual([]); }, { auto: true }],
});
async function openStory(page: Page, exportedName = 'Default', globals = 'theme:dark;motion:standard') {
  const response = await page.request.get('/index.json'); expect(response.ok()).toBeTruthy();
  const entries = Object.values((await response.json()).entries) as { id: string; title: string; type: string; exportName?: string }[];
  const suffix = exportedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); const entry = entries.find(item => item.type === 'story' && item.title === '基础组件/Spinner 加载标记' && (item.exportName === exportedName || item.id.endsWith(`--${suffix}`))); expect(entry).toBeDefined();
  await page.goto(`/iframe.html?id=${encodeURIComponent(entry!.id)}&viewMode=story&globals=${globals}`); await page.locator('#storybook-root .kit-story-surface').waitFor();
}
const motionLayers = '.ui-spinner__assembly, .ui-spinner__segment, .ui-spinner__core';
const angleDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;

test.describe('Mechanical loading marker', () => {
  test('keeps all sizes stable through varied continuous rotation, three breathing strengths and a counter-turning core', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await openStory(page, 'Sizes');
    const markers = page.getByRole('status'); await expect(markers).toHaveCount(3);
    await expect.poll(() => markers.evaluateAll(elements => elements.map(element => element.getAnimations({ subtree: true }).length))).toEqual([6, 6, 6]);
    // Collect three sizes in one renderer call: pace samples, three release peaks,
    // each turn boundary, and both complete 5.4s cycle seams.
    // Read each phase's boxes and matrices together instead of round-tripping per assertion.
    const phases = [0, 100, 648, 800, 900, 1699, 1799, 1801, 1901, 2430, 2600, 2700, 3499, 3599, 3601, 3701, 4400, 4428, 4500, 5299, 5399, 5401, 5501, 10799, 10801];
    const snapshots = await markers.evaluateAll((elements, times) => elements.map(marker => {
      const visuals = marker.querySelectorAll('svg'), visual = visuals[0]!;
      const assemblies = visual.querySelectorAll('.ui-spinner__assembly'), segments = [...visual.querySelectorAll('.ui-spinner__segment')], cores = visual.querySelectorAll('.ui-spinner__core');
      const paths = [...visual.querySelectorAll('path')], animations = visual.getAnimations({ subtree: true });
      const box = (element: Element) => { const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }; };
      const matrix = (element: Element) => new DOMMatrixReadOnly(getComputedStyle(element).transform);
      const angle = (value: { a: number; b: number }) => Math.atan2(value.b, value.a) * 180 / Math.PI;
      animations.forEach(animation => animation.pause());
      return {
        svgCount: visuals.length, viewBox: visual.getAttribute('viewBox'), hidden: visual.getAttribute('aria-hidden'), focusable: visual.getAttribute('focusable'), assemblyCount: assemblies.length, segmentCount: segments.length, coreCount: cores.length, pathCount: paths.length,
        arms: [...visual.querySelectorAll('.ui-spinner__arm')].map(element => element.getAttribute('transform')),
        frames: times.map(time => {
          animations.forEach(animation => { animation.currentTime = time; });
          const svgBox = box(visual), assembly = matrix(assemblies[0]!), core = matrix(cores[0]!);
          return {
            time, root: box(marker), assembly: angle(assembly), core: angle(core),
            segments: segments.map(element => { const value = matrix(element); return { values: [value.a, value.b, value.c, value.d, value.e, value.f], resting: value.isIdentity }; }),
            paths: paths.map(path => { const rect = box(path); return { relative: [rect.left - svgBox.left, rect.top - svgBox.top, rect.right - svgBox.left, rect.bottom - svgBox.top], contained: rect.left >= svgBox.left - .5 && rect.right <= svgBox.right + .5 && rect.top >= svgBox.top - .5 && rect.bottom <= svgBox.bottom + .5 }; }),
          };
        }),
      };
    }), phases);
    for (const [index, size] of [16, 24, 32].entries()) {
      const snapshot = snapshots[index]!;
      expect(snapshot.svgCount).toBe(1); expect(snapshot.viewBox).toBe('0 0 56 56'); expect(snapshot.hidden).toBe('true'); expect(snapshot.focusable).toBe('false');
      expect(snapshot.assemblyCount).toBe(1); expect(snapshot.segmentCount).toBe(4); expect(snapshot.coreCount).toBe(1); expect(snapshot.pathCount).toBeGreaterThanOrEqual(5);
      expect(snapshot.arms).toEqual(['rotate(0 28 28)', 'rotate(90 28 28)', 'rotate(180 28 28)', 'rotate(270 28 28)']);
      const initial = snapshot.frames[0]!;
      expect(initial.root.width).toBe(size); expect(initial.root.height).toBe(size);
      for (const frame of snapshot.frames) {
        expect(frame.root).toEqual(initial.root); expect(frame.paths.every(path => path.contained)).toBe(true);
        expect(frame.segments.some(segment => !segment.resting)).toBe(true);
      }
      const frameAt = (time: number) => snapshot.frames.find(frame => frame.time === time)!;
      const turns = [[0, 100, 800, 900], [1801, 1901, 2600, 2700], [3601, 3701, 4400, 4500]];
      const middleAdvances: number[] = [];
      for (const [front, frontEnd, middle, middleEnd] of turns) {
        const entryAdvance = angleDelta(frameAt(front!).assembly, frameAt(frontEnd!).assembly);
        const middleAdvance = angleDelta(frameAt(middle!).assembly, frameAt(middleEnd!).assembly);
        expect(entryAdvance).toBeGreaterThan(0); expect(middleAdvance).toBeGreaterThan(entryAdvance * 1.5);
        expect(middleAdvance).toBeLessThan(70); middleAdvances.push(middleAdvance);
      }
      expect(Math.max(...middleAdvances) - Math.min(...middleAdvances)).toBeGreaterThan(3);
      for (const [from, to] of [[0, 100], [800, 900], [1699, 1799], [1801, 1901], [2600, 2700], [3499, 3599], [3601, 3701], [4400, 4500], [5299, 5399], [5401, 5501]]) {
        expect(angleDelta(frameAt(from!).assembly, frameAt(to!).assembly)).toBeGreaterThan(0);
        expect(angleDelta(frameAt(from!).core, frameAt(to!).core)).toBeCloseTo(-10, 1);
      }
      // Finite 100ms samples on either side of a turn remain close in speed;
      // the two-millisecond seam itself keeps moving forward rather than holding.
      for (const [leftStart, leftEnd, rightStart, rightEnd] of [[1699, 1799, 1801, 1901], [3499, 3599, 3601, 3701], [5299, 5399, 5401, 5501]]) {
        const left = angleDelta(frameAt(leftStart!).assembly, frameAt(leftEnd!).assembly);
        const right = angleDelta(frameAt(rightStart!).assembly, frameAt(rightEnd!).assembly);
        expect(Math.max(left, right) / Math.min(left, right)).toBeLessThan(1.4);
        expect(angleDelta(frameAt(leftEnd!).assembly, frameAt(rightStart!).assembly)).toBeGreaterThan(0);
      }
      const release = (time: number) => { const values = frameAt(time).segments[0]!.values; return Math.hypot(values[4]!, values[5]!); };
      const first = release(648), strongest = release(2430), third = release(4428);
      expect(first).toBeGreaterThan(3); expect(third - first).toBeGreaterThan(.5); expect(strongest - third).toBeGreaterThan(.5); expect(strongest).toBeGreaterThan(5);
      for (const time of [648, 2430, 4428]) expect(new Set(frameAt(time).segments.map(segment => JSON.stringify(segment.values))).size).toBeGreaterThan(1);
      for (const [before, after] of [[1799, 1801], [3599, 3601], [5399, 5401], [10799, 10801]]) {
        const previous = frameAt(before!).paths, next = frameAt(after!).paths;
        expect(next).toHaveLength(previous.length);
        for (let path = 0; path < previous.length; path++) for (let edge = 0; edge < 4; edge++) expect(Math.abs(previous[path]!.relative[edge]! - next[path]!.relative[edge]!)).toBeLessThan(.35);
      }
    }
    await openStory(page); await expect(page.getByRole('status')).toHaveText('加载中'); await expect(page.getByText('加载中', { exact: true })).toHaveCount(1); await expect(page.locator('.ui-spinner input,.ui-spinner button,.ui-spinner [tabindex]')).toHaveCount(0);
  });

  test('stops all six motion layers for either reduced-motion source and retains a clear forced-color mechanism', async ({ page }) => {
    for (const source of ['container', 'system']) {
      await page.emulateMedia({ reducedMotion: source === 'system' ? 'reduce' : 'no-preference' }); await openStory(page, 'Default', `theme:${source === 'system' ? 'dark' : 'light'};motion:${source === 'container' ? 'reduced' : 'standard'}`);
      const visual = page.getByRole('status').locator('svg'); expect(await visual.evaluate(element => getComputedStyle(element).animationName)).toBe('none'); expect(await visual.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
      await expect(visual.locator(motionLayers)).toHaveCount(6);
      expect(await visual.locator(motionLayers).evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none' && getComputedStyle(element).transform === 'none'))).toBe(true);
      await expect(visual.locator('.ui-spinner__arm')).toHaveCount(4); expect(new Set(await visual.locator('.ui-spinner__arm').evaluateAll(elements => elements.map(element => getComputedStyle(element).transform))).size).toBe(4);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' }); await openStory(page);
    const visual = page.getByRole('status').locator('svg'); expect(await visual.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(visual.locator(motionLayers)).toHaveCount(6);
    expect(await visual.locator(motionLayers).evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none' && getComputedStyle(element).transform === 'none'))).toBe(true);
    expect(await visual.locator('path').evaluateAll(elements => elements.every(element => { const style = getComputedStyle(element); return (style.stroke !== 'none' || style.fill !== 'none') && style.opacity !== '0'; }))).toBe(true);
    await expect(page.getByRole('status')).toHaveText('加载中');
  });

  test('shows user-controlled busy feedback in a 44px touch button with one parent message and no request', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true }); const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'warning' && message.text().includes('[Vue warn]')) errors.push(message.text()); });
    try {
      await openStory(page, 'BusyRegion'); await page.waitForLoadState('networkidle'); const requests: string[] = []; page.on('request', request => requests.push(request.url()));
      const region = page.getByRole('region', { name: '设计档案列表', exact: true }); await expect(region).toHaveAttribute('aria-busy', 'false');
      const start = page.getByRole('button', { name: '开始整理', exact: true }); const size = await start.boundingBox(); expect(size!.height).toBeGreaterThanOrEqual(44);
      await start.click(); await expect(region).toHaveAttribute('aria-busy', 'true'); await expect(page.getByRole('status')).toHaveCount(1); await expect(page.getByRole('status')).toHaveText('本地档案正在整理。');
      await expect(page.locator('.ui-spinner')).toHaveAttribute('aria-hidden', 'true'); await expect(page.getByText('本地档案正在整理。', { exact: true })).toHaveCount(1);
      const retired = await page.locator('.ui-spinner').evaluateHandle(element => element);
      await page.getByRole('button', { name: '完成整理', exact: true }).click(); await expect(region).toHaveAttribute('aria-busy', 'false'); await expect(page.getByRole('status')).toHaveText('本地档案已准备好。');
      await expect(page.getByRole('button', { name: '再次整理', exact: true })).toBeFocused(); await expect.poll(() => retired.evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0); await retired.dispose();
      expect(requests).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360); expect(errors).toEqual([]);
      await openStory(page, 'MechanismDetail');
      await expect(page.getByRole('status')).toHaveCount(4);
      for (const label of ['档案载入中', '校准中', '连接中']) {
        const button = page.getByRole('button', { name: label, exact: true });
        await expect(button).toBeDisabled(); await expect(button).toHaveAttribute('aria-busy', 'true'); await expect(button).toHaveAccessibleName(label);
        const spinner = button.locator('.ui-spinner'); await expect(spinner).toHaveCount(1); await expect(spinner).toHaveAttribute('aria-hidden', 'true');
        await expect(spinner.locator('svg')).toHaveCount(1); await expect(spinner.locator('.ui-spinner__core')).toHaveCount(1);
        const textColor = await button.evaluate(element => getComputedStyle(element).color);
        expect(await spinner.evaluate(element => getComputedStyle(element).color)).toBe(textColor);
        expect(await spinner.locator('.ui-spinner__core').evaluate(element => getComputedStyle(element).color)).toBe(textColor);
        await expect(button.getByRole('status')).toHaveCount(0);
      }
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
});
