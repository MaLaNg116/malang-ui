import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@playwright/test/cli');
const shards = process.env.MALANG_BROWSER_SHARD ? [Number(process.env.MALANG_BROWSER_SHARD)] : [1, 2];
if (shards.some(shard => ![1, 2].includes(shard))) throw new Error('MALANG_BROWSER_SHARD must be 1 or 2');
// Keep the five-minute bound on each independent shard. No retries or extended
// assertions: a slow or broken interaction must still fail at its source.
for (const shard of shards) {
  const result = spawnSync(process.execPath, [cli, 'test', `--shard=${shard}/2`, `--output=test-results/shard-${shard}`, ...process.argv.slice(2)], { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
