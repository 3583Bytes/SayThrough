import { expect, test } from '@playwright/test'
import { setupProfile } from './helpers'

// The core PWA promise: works after the first visit with no network.
test('app and symbols work offline after first load', async ({ page, context }) => {
  await setupProfile(page)

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
  await page.getByLabel('want', { exact: true }).waitFor({ timeout: 20_000 })

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
