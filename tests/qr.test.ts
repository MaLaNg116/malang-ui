import { describe, expect, it } from 'vitest';
import jsQR from 'jsqr';
import { encodeQRCode, qrContrast, type MQRCodeLevel } from '../src/components/reference-common/qr';

function decode(value: string | readonly string[], level: MQRCodeLevel, logo = false) {
  const matrix = encodeQRCode(value, level), scale = 6, side = (matrix.size + 8) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  const logoStart = matrix.size * .42, logoEnd = matrix.size * .58;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const row = Math.floor(y / scale) - 4, col = Math.floor(x / scale) - 4;
    const hidden = logo && row > logoStart && row < logoEnd && col > logoStart && col < logoEnd;
    if (!hidden && matrix.modules[row]?.[col]) { const i = (y * side + x) * 4; pixels[i] = pixels[i + 1] = pixels[i + 2] = 0; }
  }
  return jsQR(pixels, side, side)?.data;
}
describe('QR code interoperability', () => {
  for (const level of ['L', 'M', 'Q', 'H'] as const) it(`decodes Unicode and URLs with independent jsQR at level ${level}`, () => {
    const value = 'https://malang-ui.test/藏品?name=墨浪🖋️&版本=3';
    expect(decode(value, level)).toBe(value);
  });
  it('supports multiple segments and longer payloads', () => {
    const value = ['MALANG/', '档案-'.repeat(30), '/END']; expect(decode(value, 'M')).toBe(value.join(''));
  });
  it('retains scannability with a bounded center icon at high correction', () => {
    const value = 'https://github.com/MaLaNg116/malang-ui'; expect(decode(value, 'H', true)).toBe(value);
  });
  it('rejects empty and excessive values instead of displaying a fake matrix', () => {
    expect(() => encodeQRCode('')).toThrow(); expect(() => encodeQRCode('x'.repeat(4000), 'H')).toThrow();
  });
  it('validates foreground/background pairs', () => {
    expect(qrContrast('#26332e', '#fffdf7')).toBeGreaterThan(10);
    expect(qrContrast('#eeeeee', '#ffffff')).toBeLessThan(4.5);
    expect(() => qrContrast('transparent', '#ffffff')).toThrow();
  });
});
