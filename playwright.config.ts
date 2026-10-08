import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI

/**
 * End-to-end tests run against the *production builds* of both zones, wired
 * together exactly like docker compose: the shell proxies /loans to the loans app.
 * Run `pnpm build` first.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], storageState: 'e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: 'node apps/loans/.output/server/index.mjs',
      url: 'http://localhost:3001/loans/healthz',
      env: { PORT: '3001', NUXT_API_ORIGIN: 'http://localhost:3000' },
      reuseExistingServer: !CI,
    },
    {
      command: 'node apps/shell/.output/server/index.mjs',
      url: 'http://localhost:3000/healthz',
      env: {
        PORT: '3000',
        NUXT_LOANS_ZONE_URL: 'http://localhost:3001',
        NUXT_SESSION_PASSWORD: 'e2e-only-session-password-0123456789-abcdef',
        NUXT_LOAN_SIMULATOR_INTERVAL_MS: '4000',
      },
      reuseExistingServer: !CI,
    },
  ],
})
