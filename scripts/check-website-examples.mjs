import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'vue/compiler-sfc';

const root = new URL('../website/src/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('data/components.json', root), 'utf8'));
const names = new Set(catalog.map(item => item.name));
let count = 0;
for (const folder of readdirSync(new URL('examples/', root), { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  if (!names.has(folder.name)) throw Error(`Example folder has no public component: ${folder.name}`);
  const directory = new URL(`examples/${folder.name}/`, root);
  const files = readdirSync(directory).filter(name => name.endsWith('.vue'));
  if (!files.includes('basic.vue')) throw Error(`Missing basic example: ${folder.name}`);
  for (const name of files) {
    const file = new URL(name, directory);
    const source = readFileSync(file, 'utf8');
    const { descriptor, errors } = parse(source, { filename: fileURLToPath(file) });
    if (errors.length || !descriptor.template || !descriptor.scriptSetup) throw Error(`Invalid native example: ${folder.name}/${name}`);
    if (!source.includes(folder.name) || !/from ['"]malang-ui['"]/.test(source)) throw Error(`Example must use the public component: ${folder.name}/${name}`);
    if (descriptor.styles.some(style => !style.scoped)) throw Error(`Example styles must be scoped: ${folder.name}/${name}`);
    count += 1;
  }
  names.delete(folder.name);
}
if (names.size) throw Error(`Missing component examples: ${[...names].join(', ')}`);
console.log(`Verified ${count} native Vue examples for ${catalog.length} public components.`);
