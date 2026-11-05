import { describe, expect, it } from 'vitest';
import tokens from '../design/tokens.json';

// WCAG relative luminance, using unrounded sRGB values for the named opaque roles.
function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0]! * .2126 + channels[1]! * .7152 + channels[2]! * .0722;
}
function contrast(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
const palettes: [string, Record<string, string>][] = Object.entries(tokens.lightPalettes).map(([key, palette]) => [key, { ...tokens.themes.light, ...palette.colors }]);
palettes.push(['dark', tokens.themes.dark]);
const backgrounds = ['color-canvas', 'color-surface', 'color-surface-raised', 'color-surface-muted'];
describe('material palette contracts', () => {
  it.each(palettes)('%s keeps small text, primary labels and control cues readable', (_name, palette) => {
    for (const foreground of ['color-text', 'color-text-secondary', 'color-info', 'color-accent', 'color-secondary-accent', 'color-success', 'color-danger', 'color-warning']) {
      for (const background of backgrounds) expect(contrast(palette[foreground]!, palette[background]!), `${foreground} / ${background}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(palette['color-on-accent']!, palette['color-accent']!)).toBeGreaterThanOrEqual(4.5);
    for (const background of backgrounds) {
      expect(contrast(palette['color-border']!, palette[background]!)).toBeGreaterThanOrEqual(3);
      expect(contrast(palette['color-focus']!, palette[background]!)).toBeGreaterThanOrEqual(3);
      expect(contrast(palette['color-metal']!, palette[background]!), 'scrollbar thumb').toBeGreaterThanOrEqual(3);
    }
  });
  it('provides complete nested-theme resets and distinct material roles', () => {
    for (const [, palette] of palettes) expect(Object.keys(palette).sort()).toEqual(Object.keys(tokens.themes.light).sort());
    expect(new Set(palettes.slice(0, 3).map(([, palette]) => palette['color-accent'])).size).toBe(3);
    for (const [, palette] of palettes.slice(0, 3)) {
      const seal = palette['color-seal']!;
      expect(parseInt(seal.slice(1, 3), 16)).toBeGreaterThan(parseInt(seal.slice(3, 5), 16) * 1.5);
      expect(palette['color-canvas']).not.toBe(palette['color-surface']);
      expect(palette['color-surface']).not.toBe(palette['color-surface-muted']);
    }
  });
});
