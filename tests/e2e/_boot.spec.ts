import { test } from '@playwright/test'
import { setupProfile } from './helpers'
test('where does bootstrap stall offline', async ({ page, context }) => {
  test.setTimeout(120_000)
  await setupProfile(page)
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg?.active || !navigator.serviceWorker.controller) return false
    const p = (await (await caches.open('saythrough-v1')).keys()).map(k => new URL(k.url).pathname)
    return p.some(x => /index\.html$|\/app\/$/.test(x)) && p.some(x => x.includes('/_expo/') && x.endsWith('.js'))
  }, { timeout: 30_000 })
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  let ok = true
  try { await page.getByLabel('want', { exact: true }).waitFor({ timeout: 15_000 }) } catch { ok = false }
  const steps = await page.evaluate(() => (globalThis as any).__boot ?? [])
  console.log(`BOOT ok=${ok} steps=${JSON.stringify(steps)}`)
})
