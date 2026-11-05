import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import parity from '../design/component-parity.json';
import coverage from '../design/component-coverage.json';
describe('official catalog completeness', () => {
  it('retains every official core catalog item with a real mapped implementation', () => {
    expect(parity.entries.filter(entry => entry.library === 'ant-design')).toHaveLength(73);
    expect(parity.entries.filter(entry => entry.library === 'element-plus')).toHaveLength(82);
    expect(new Set(parity.entries.map(entry => `${entry.library}/${entry.name}`)).size).toBe(155);
    for (const entry of parity.entries) {
      expect(entry.status, `${entry.library}/${entry.name}`).not.toBe('missing');
      expect(entry.sources.length, entry.name).toBeGreaterThan(0);
      for (const source of entry.sources) expect(existsSync(resolve(source)), `${entry.name}: ${source}`).toBe(true);
      if (entry.kind === 'component' || entry.kind === 'deprecated-reference') expect(entry.components.length, entry.name).toBeGreaterThan(0);
    }
  });
  it('keeps public export counts and reference mappings synchronized', () => {
    const exports = new Set<string>();
    for (const file of ['src/components.ts', ...['common', 'inputs', 'layout', 'data'].map(lane => `src/components/reference-${lane}/index.ts`)]) {
      for (const match of readFileSync(file, 'utf8').matchAll(/export\s*\{\s*default\s+as\s+(M\w+)\s*\}/g)) exports.add(match[1]);
    }
    expect(coverage.publicComponentCount).toBe(exports.size);
    for (const entry of parity.entries) for (const name of entry.components) expect(exports.has(name), `${entry.name}: ${name}`).toBe(true);
    const mapped = new Set(parity.entries.flatMap(entry => entry.components));
    expect([...exports].filter(name => !mapped.has(name))).toEqual([]);
  });
});
