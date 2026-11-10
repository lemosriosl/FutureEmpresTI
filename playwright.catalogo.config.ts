import { randomBytes } from 'node:crypto';
import { defineConfig } from '@playwright/test';

process.env.CATALOGO_TEST_PASSWORD ??= randomBytes(24).toString('hex');

export default defineConfig({
  testDir: 'tests/catalogo',
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 25_000 },
  use: { baseURL: 'http://127.0.0.1:3131' },
  webServer: {
    command: 'node --import tsx tests/catalogo/local-server.ts',
    url: 'http://127.0.0.1:3131/login',
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
