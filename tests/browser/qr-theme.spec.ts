import { expect, test, type Locator, type Page } from '@playwright/test';
import jsQR from 'jsqr';

test.use({ hasTouch: true });
const archiveUrl = 'https://github.com/MaLaNg116/malang-ui';

async function openStory(page: Page, name: string, globals = 'theme:light;motion:reduced') {
  const response = await page.request.get('/index.json');
  expect(response.ok()).toBeTruthy();
  const index = await response.json() as { entries: Record<string, { id: string; title: string; type: string }> };
  const story = Object.values(index.entries).find(entry => entry.type === 'story' && entry.title === '数据展示/QRCode 二维码' && entry.id.endsWith(`--${name}`));
  expect(story).toBeDefined();
  const params = new URLSearchParams({ id: story!.id, viewMode: 'story', globals });
  await page.goto(`/iframe.html?${params}`);
  await page.locator('#storybook-root .kit-story-surface').waitFor();
}

async function decodeImage(page: Page, src: string) {
  const raster = await page.evaluate(async src => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return { width: canvas.width, height: canvas.height, pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data) };
  }, src);
  return jsQR(new Uint8ClampedArray(raster.pixels), raster.width, raster.height, { inversionAttempts: 'dontInvert' })?.data;
}

async function decodeScreenshot(page: Page, code: Locator) {
  const image = await code.screenshot();
  return decodeImage(page, `data:image/png;base64,${image.toString('base64')}`);
}

test('four materials preserve the cut ink geometry and decode at their actual screen size', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await openStory(page, 'materials');
  const finishes = new Set<string>();
  for (const material of ['宣纸', '浓墨', '青瓷', '绢素']) {
    const image = page.getByRole('img', { name: `${material}码印`, exact: true });
    const frame = page.locator('.ui-qrcode').filter({ has: image });
    await expect(frame.locator('.ui-qrcode__hint')).toHaveText('SCAN / 轻扫识别');
    await expect(frame).toHaveAttribute('data-qr-level', 'M');
    await expect(frame).toHaveAttribute('data-qr-version', /^\d+$/);
    await expect(image.locator('rect')).toHaveAttribute('fill', '#fffdf7');
    const ink = image.locator('path');
    await expect(ink).toHaveAttribute('fill', '#26332e');
    await expect(ink).toHaveAttribute('shape-rendering', 'geometricPrecision');
    await expect(ink).toHaveAttribute('d', /^M4 4H[\d.]+L11 4\.\d+/);
    expect(await frame.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
    expect(await decodeScreenshot(page, frame)).toBe(archiveUrl);
    const box = await frame.boundingBox();
    expect(box?.width).toBe(200);
    expect(box?.height).toBe(200);
    finishes.add(await frame.evaluate(el => getComputedStyle(el).backgroundImage));
  }
  expect(finishes.size).toBe(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
});

test('80px framed, plain and constrained codes retain the quiet zone and a touch-sized refresh action', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openStory(page, 'compact', 'theme:dark;motion:reduced');
  const small = page.getByRole('img', { name: '微型码印', exact: true });
  const plain = page.getByRole('img', { name: '微型净码', exact: true });
  const constrained = page.getByRole('img', { name: '限宽码印', exact: true });
  const framedCode = page.locator('.ui-qrcode').filter({ has: small });
  const plainCode = page.locator('.ui-qrcode').filter({ has: plain });
  const constrainedCode = page.locator('.ui-qrcode').filter({ has: constrained });
  await expect(framedCode.locator('.ui-qrcode__serial')).toBeHidden();
  await expect(plainCode.locator('.ui-qrcode__frame')).toHaveCount(0);
  await expect(small.locator('path')).toHaveAttribute('d', /^M4 4h1v1h-1z/);
  await expect(plain.locator('path')).toHaveAttribute('d', /^M4 4h1v1h-1z/);
  await expect(constrained.locator('path')).toHaveAttribute('shape-rendering', 'crispEdges');
  for (const code of [framedCode, plainCode, constrainedCode]) {
    const box = await code.boundingBox();
    expect(box?.width).toBe(80);
    expect(box?.height).toBe(80);
    expect(await decodeScreenshot(page, code)).toBe('ML-08');
  }
  const plainSize = await plain.evaluate((element: SVGSVGElement) => ({
    width: element.getBoundingClientRect().width,
    extent: element.viewBox.baseVal.width,
  }));
  expect(plainSize.width).toBeLessThanOrEqual(80);
  expect(Number.isInteger(plainSize.width / plainSize.extent)).toBe(true);
  const parent = constrainedCode.locator('..');
  await parent.evaluate((element: HTMLElement) => { element.style.width = '200px'; });
  await expect(constrained.locator('path')).toHaveAttribute('shape-rendering', 'geometricPrecision');
  await parent.evaluate((element: HTMLElement) => { element.style.width = '80px'; });
  await expect(constrained.locator('path')).toHaveAttribute('shape-rendering', 'crispEdges');
  expect(await decodeScreenshot(page, constrainedCode)).toBe('ML-08');

  const refresh = page.getByRole('button', { name: '刷新', exact: true });
  const expired = page.locator('.ui-qrcode[data-status="expired"]');
  const buttonBox = (await refresh.boundingBox())!;
  const frameBox = (await expired.boundingBox())!;
  expect(buttonBox.height).toBeGreaterThanOrEqual(44);
  expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(frameBox.y + frameBox.height);
  await refresh.tap();
  await expect(page.getByRole('img', { name: '恢复后的微型码印', exact: true })).toBeVisible();
});

test('dense text snaps to whole screen pixels and decodes in the original SVG export dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 368, height: 800 });
  await openStory(page, 'dense-code');
  const payload = '墨浪档案'.repeat(34) + ' / QR014';
  const image = page.getByRole('img', { name: '长文本二维码', exact: true });
  const code = page.locator('.ui-qrcode').filter({ has: image });
  await expect(image).toBeVisible();
  expect((await code.boundingBox())?.width).toBe(328);
  const pitch = await image.evaluate((node: SVGSVGElement) => node.getBoundingClientRect().width * devicePixelRatio / node.viewBox.baseVal.width);
  expect(pitch).toBeGreaterThan(1);
  expect(pitch).toBeCloseTo(Math.round(pitch), 2);
  expect(await decodeScreenshot(page, code)).toBe(payload);

  await page.getByRole('button', { name: '生成原尺寸 SVG', exact: true }).click();
  const preview = page.getByRole('img', { name: '长文本 SVG 预览', exact: true });
  await expect(preview).toHaveAttribute('src', /^data:image\/svg\+xml/);
  const src = (await preview.getAttribute('src'))!;
  const output = await preview.evaluate(async (node: HTMLImageElement) => {
    await node.decode();
    return { width: node.naturalWidth, height: node.naturalHeight };
  });
  expect(output).toEqual({ width: 386, height: 386 });
  expect(await decodeImage(page, src)).toBe(payload);
});

test('the ink code decodes without a frame in all four correction levels', async ({ page }) => {
  await openStory(page, 'ink-samples');
  const samples = [
    ['英文 · L', 'L', 'Ink archive / 014', 'svg'],
    ['中文 · M', 'M', '墨浪工坊 · 经卷校对', 'canvas'],
    ['网址 · Q', 'Q', archiveUrl, 'svg'],
    ['混合文本 · H', 'H', '墨浪 / Ink archive', 'canvas'],
  ] as const;
  for (const [name, level, payload, type] of samples) {
    const image = page.getByRole('img', { name, exact: true });
    const code = page.locator('.ui-qrcode').filter({ has: image });
    await expect(code).toHaveAttribute('data-qr-level', level);
    await expect(code.locator('.ui-qrcode__frame')).toHaveCount(0);
    if (type === 'canvas') {
      await expect.poll(() => image.evaluate((node: HTMLCanvasElement) => node.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(255);
    } else {
      await expect(image.locator('path')).toHaveAttribute('shape-rendering', 'geometricPrecision');
    }
    expect(await decodeScreenshot(page, code)).toBe(payload);
  }
});

test('the center seal remains decodable on screen and in clean SVG and PNG exports', async ({ page }) => {
  await openStory(page, 'icon-export', 'theme:light;palette:celadon;motion:reduced');
  const canvas = page.getByRole('img', { name: '朱砂印记二维码', exact: true });
  const frame = page.locator('.ui-qrcode').filter({ has: canvas });
  await expect(frame).toHaveAttribute('data-qr-level', 'H');
  await expect.poll(() => canvas.evaluate((node: HTMLCanvasElement) => {
    const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;
    return pixels.some((red, index) => index % 4 === 0 && red === 161 && pixels[index + 1] === 60 && pixels[index + 2] === 49);
  })).toBe(true);
  expect(await decodeScreenshot(page, frame)).toBe(archiveUrl);

  const preview = page.getByRole('img', { name: '带印净码预览', exact: true });
  await page.getByRole('button', { name: '导出 PNG 净码', exact: true }).click();
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  expect(await decodeImage(page, (await preview.getAttribute('src'))!)).toBe(archiveUrl);
  await page.getByRole('button', { name: '导出 SVG 净码', exact: true }).click();
  await expect(preview).toHaveAttribute('src', /^data:image\/svg\+xml/);
  const src = (await preview.getAttribute('src'))!;
  const svg = decodeURIComponent(src.slice(src.indexOf(',') + 1));
  expect(svg).toContain('shape-rendering="geometricPrecision"');
  expect(svg).not.toContain('ui-qrcode');
  expect(await decodeImage(page, src)).toBe(archiveUrl);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a translucent status mask covers the visible code and refresh restores accessible scanning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await openStory(page, 'states', 'theme:dark;motion:standard');
  const preview = page.getByTestId('qr-status-preview');
  const image = preview.locator('.ui-qrcode__image');
  const mask = preview.locator('.ui-qrcode__mask');
  await expect(image).toBeVisible();
  await expect(mask).toBeVisible();
  await expect(preview.locator('.ui-qrcode__code')).toHaveAttribute('aria-hidden', 'true');
  await expect(preview.getByRole('img', { name: '待刷新档案二维码', exact: true })).toHaveCount(0);
  const covers = await preview.evaluate(element => {
    const mask = element.querySelector('.ui-qrcode__mask')!.getBoundingClientRect();
    const image = element.querySelector('.ui-qrcode__image')!.getBoundingClientRect();
    return mask.left <= image.left && mask.top <= image.top && mask.right >= image.right && mask.bottom >= image.bottom;
  });
  expect(covers).toBe(true);
  const alpha = await mask.evaluate(element => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    return context.getImageData(0, 0, 1, 1).data[3]!;
  });
  expect(alpha).toBeGreaterThan(0);
  expect(alpha).toBeLessThan(255);
  const original = await image.elementHandle();
  await page.getByRole('button', { name: '标记加载', exact: true }).click();
  await expect(preview.getByRole('status')).toContainText('加载中');
  await page.getByRole('button', { name: '标记已扫描', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('已扫描');
  await expect(image).toBeVisible();
  await expect(mask).toBeVisible();
  await page.getByRole('button', { name: '标记过期', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('二维码已过期');
  await preview.getByRole('button', { name: '刷新', exact: true }).click();
  await expect(preview).toHaveAttribute('data-status', 'active');
  await expect(mask).toBeHidden();
  await expect(preview.getByRole('img', { name: '待刷新档案二维码', exact: true })).toBeVisible();
  expect(await original!.evaluate(node => node.isConnected)).toBe(true);
  expect(await image.evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await decodeScreenshot(page, preview)).toBe(archiveUrl);
});
