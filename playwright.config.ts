import { defineConfig, devices } from '@playwright/test'

// E2E against the exported web build (dist/). `npm run e2e` builds first;
// the webServer here serves dist/ on 8090. Each test gets a fresh browser
// context → fresh IndexedDB, so every spec starts at onboarding.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  // Capped deliberately. Three of these specs load a ~60 MB Piper model into a
  // browser, and dist/ now carries one per language, so unbounded parallelism
  // exhausts memory and kills browsers mid-test ("Target page, context or
  // browser has been closed") — a harness failure that reads like a product
  // one. Playwright's default is half the core count, which is fine on a
  // 2-core CI runner and far too many on a developer laptop; 2 passes
  // reliably in both places for about 45s more wall clock.
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: 'http://localhost:8090',
    trace: 'on-first-retry',
    viewport: { width: 1024, height: 768 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Firefox is checked on the platform-sensitive paths only, so CI stays
    // fast. Chromium-only coverage previously missed a bug that made the app
    // completely unusable in Firefox: storage.init() awaited
    // navigator.storage.persist(), which Firefox answers with a permission
    // prompt and never resolves, so the app hung on its loading screen.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /(speech|communication|offline)\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs',
    url: 'http://localhost:8090',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
