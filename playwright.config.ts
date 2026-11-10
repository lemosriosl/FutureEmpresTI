import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3130';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL },
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1 --port 3130',
    url: `${baseURL}/login`,
    env: {
      EMPRES_TI_NEXT_DIST_DIR: '.next/playwright-login',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:1',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-sem-credenciais',
      DATABASE_URL: 'postgresql://e2e:e2e@127.0.0.1:1/indisponivel',
      DIRECT_URL: 'postgresql://e2e:e2e@127.0.0.1:1/indisponivel',
      LOGIN_RATE_LIMIT_SECRET: 'e2e-ficticio-para-banco-indisponivel',
    },
    reuseExistingServer: false,
  },
});
