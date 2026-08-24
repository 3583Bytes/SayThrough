import { expect, test } from '@playwright/test'
import { setupProfile } from './helpers'

// The core PWA promise: works after the first visit with no network.
test('app and symbols work offline after first load', async ({ page, context }) => {
  // Genuinely heavy: it fills the symbol cache, then cold-boots the whole app
  // with no network. Normally ~3s, but it is the slowest test in the suite and
  // was timing out under CI contention.
  test.slow()
  await setupProfile(page)

  // The shell is cached by the service worker's install handler, which is
  // independent of the symbol warmup below. Going offline before it has
  // finished leaves networkFirstShell with nothing to fall back to — the race
  // behind this test's flakiness. Wait for the worker to be ACTIVE and
  // CONTROLLING, and for the shell to actually be in the cache.
  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg?.active || !navigator.serviceWorker.controller) return false
      const cache = await caches.open('saythrough-v1')
      const keys = await cache.keys()
      return keys.some((k) => /index\.html$|\/app\/$/.test(new URL(k.url).pathname))
    },
    { timeout: 30_000 },
  )

  // wait for the service worker's symbol warmup to fill the cache
  await page.waitForFunction(
    async () => {
      const cache = await caches.open('saythrough-v1')
      const keys = await cache.keys()
      return keys.filter((k) => k.url.includes('/symbols/')).length >= 40
    },
    { timeout: 30_000 },
  )

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  // Booting offline means service-worker shell + bundle + IndexedDB + seed,
  // all while other workers compete for the machine.
  await page.getByLabel('want', { exact: true }).waitFor({ timeout: 45_000 })

  // navigate to a page not visited this session — symbols come from cache
  await page.getByLabel('Feelings, opens page').click()
  await page.getByLabel('happy', { exact: true }).waitFor()
  await page.waitForTimeout(500)
  const broken = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('img')).filter(
        (img) => img.complete && img.naturalWidth === 0,
      ).length,
  )
  expect(broken).toBe(0)

  // and communication still works offline
  await page.getByLabel('happy', { exact: true }).click()
  await expect(page.locator('[aria-live="polite"]').getByText('happy')).toBeVisible()
})
