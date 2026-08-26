import { expect, test } from '@playwright/test'
import { setupProfile } from './helpers'

// The core PWA promise: works after the first visit with no network.
//
// Previously this was one test that waited for a BACKGROUND warm-up to race
// through 212 symbol requests and then cold-booted offline. It passed locally
// in ~4s and failed at 45s on CI, and none of CPU throttling, injected
// latency or full-suite parallelism reproduced it — a sign the coupling was
// the problem, not the timeout. Split into two deterministic checks.

test('the app boots and speaks with no network', async ({ page, context }) => {
  test.slow()
  await setupProfile(page)

  // Wait for the JS BUNDLE, not just the shell. networkFirstShell caches
  // index.html on the first navigation, which happens well before the install
  // handler finishes precaching the bundles — so "shell is cached" is true
  // while the app is still unbootable offline: HTML with no JavaScript. That
  // race is what made this test fail at 45s while passing locally in 4s.
  await page.waitForFunction(
    async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg?.active || !navigator.serviceWorker.controller) return false
      const paths = (await (await caches.open('saythrough-v1')).keys()).map(
        (k) => new URL(k.url).pathname,
      )
      const shell = paths.some((p) => /index\.html$|\/app\/$/.test(p))
      const bundle = paths.some((p) => p.includes('/_expo/') && p.endsWith('.js'))
      return shell && bundle
    },
    { timeout: 30_000 },
  )

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByLabel('want', { exact: true }).waitFor({ timeout: 45_000 })

  // Symbols come from the cache, not the network.
  await page.getByLabel('Feelings, opens page').click()
  await page.getByLabel('happy', { exact: true }).waitFor()
  await page.waitForTimeout(300)
  const broken = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('img')).filter(
        (img) => img.complete && img.naturalWidth === 0,
      ).length,
  )
  expect(broken).toBe(0)

  // And communication still works.
  await page.getByLabel('happy', { exact: true }).click()
  await expect(page.locator('[aria-live="polite"]').getByText('happy')).toBeVisible()
})

test('the warm-up caches a page the user has not opened', async ({ page }) => {
  // The other half of the offline promise, checked WITHOUT a reload.
  //
  // Asserts that a SPECIFIC symbol from a never-opened page arrives in the
  // cache, rather than counting entries: the browser evicts Cache API storage
  // under pressure, so a count is not a stable thing to assert — it was seen
  // dropping from 40+ to 10 between two consecutive reads.
  const { happy } = require('../../src/data/seedSymbolMap.json') as Record<string, string>
  const symbolId = happy.split(':')[1]

  await setupProfile(page)

  await page.waitForFunction(
    async (id) => {
      const keys = await (await caches.open('saythrough-v1')).keys()
      return keys.some((k) => k.url.includes(`/symbols/arasaac/${id}.webp`))
    },
    symbolId,
    { timeout: 60_000 },
  )

  // 'happy' lives on Feelings, which this test never opened.
  await expect(page.getByLabel('Feelings, opens page')).toBeVisible()
  await expect(page.getByLabel('happy', { exact: true })).toHaveCount(0)
})
