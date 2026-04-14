import { defineConfig, devices } from '@playwright/test';
import dotenv from 'node:fs';
import path from 'node:path';

// Carrega .env.local manualmente (Node não faz isso nativamente)
try {
  const content = dotenv.readFileSync('.env.local', 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]!]) {
      process.env[match[1]!] = match[2];
    }
  }
} catch {
  // .env.local opcional
}

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/helpers/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  globalSetup: path.resolve('./tests/e2e/helpers/global-setup.ts'),
  globalTeardown: path.resolve('./tests/e2e/helpers/global-teardown.ts'),
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
