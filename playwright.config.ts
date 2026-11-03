import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:6007';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 30_000,
  globalTimeout: 300_000,
  expect: { timeout: 7_000 },
  reporter: 'list',
  outputDir: 'test-results',
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  }],
  webServer: {
    command: 'pnpm exec storybook dev --port 6007 --ci --no-open',
    url: `${baseURL}/index.json`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
