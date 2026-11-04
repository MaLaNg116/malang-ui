import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile(new URL('../design/tokens.json', import.meta.url), 'utf8'));
const declarations = (values) => Object.entries(values).map(([name, value]) => `  --ui-${name}: ${value};`).join('\n');
const block = (selector, values) => `${selector} {\n${declarations(values)}\n}`;
const css = [
  '/* Generated from design/tokens.json. Run pnpm tokens after editing tokens. */',
  '/* Ink-tech palettes. Defines variables only; theme and palette share one container. */',
  block(':root', { ...source.tokens, ...source.themes.light, ...source.densities.comfortable }),
  block('[data-ui-theme="light"]', source.themes.light),
  block('[data-ui-theme="dark"]', source.themes.dark),
  '@media (prefers-color-scheme: dark) {\n' + block(':root:not([data-ui-theme="light"])', source.themes.dark) + '\n}',
  ...Object.entries(source.lightPalettes ?? {}).map(([name, palette]) => block(`[data-ui-theme="light"][data-ui-palette="${name}"]`, { ...source.themes.light, ...palette.colors })),
  block('[data-ui-density="comfortable"]', source.densities.comfortable),
  block('[data-ui-density="compact"]', source.densities.compact),
  block('[data-ui-motion="reduced"]', source.motionProfiles.reduced),
  '@media (prefers-reduced-motion: reduce) {\n' + block(':root, [data-ui-motion]', source.motionProfiles.reduced) + '\n}',
  '/* JS-driven animations must honor reduced motion in their own controllers. */',
  '/* MG durations belong to each composition rather than the UI timings above. */',
  ''
].join('\n\n').trimEnd() + '\n';

await writeFile(new URL('../src/styles/tokens.css', import.meta.url), css);
console.log('Generated src/styles/tokens.css');
