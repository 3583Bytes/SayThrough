import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'

// Visitor counting on the MARKETING pages. The app at /app/ must never send
// anything: it promises nothing leaves the device, its users are largely
// children with disabilities, and it is single-domain so districts can
// whitelist one host.

const ENDPOINT = /dashboard\.3583bytes\.com/

test.describe('visitor counting', () => {
  test('the marketing page sends a heartbeat with a valid key', async ({ page }) => {
    const beats: Array<{ body: any; key: string | undefined }> = []
    await page.route(ENDPOINT, async (route) => {
      const request = route.request()
      beats.push({
        body: request.postDataJSON(),
        key: request.headers()['x-secret-key'],
      })
      await route.fulfill({ status: 200, body: '{"status":"ok"}' })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await expect.poll(() => beats.length).toBeGreaterThan(0)

    const beat = beats[0]
    expect(beat.body.game_name).toBe('SayThrough')
    expect(beat.body.player_id).toMatch(/^web-[0-9a-f]{16}$/)
    // The service validates sha256(player_id); a wrong key is a 401.
    expect(beat.key).toBe(createHash('sha256').update(beat.body.player_id).digest('hex'))
  })

  test('sends nothing that identifies the visitor', async ({ page }) => {
    const payloads: string[] = []
    await page.route(ENDPOINT, async (route) => {
      payloads.push(route.request().postData() ?? '')
      await route.fulfill({ status: 200, body: '{}' })
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect.poll(() => payloads.length).toBeGreaterThan(0)

    // Only a random id and the app name — no page content, no user agent,
    // no referrer, nothing typed.
    const body = JSON.parse(payloads[0])
    expect(Object.keys(body).sort()).toEqual(['game_name', 'player_id'])
  })

  test('the AAC app itself sends nothing', async ({ page }) => {
    const beats: string[] = []
    await page.route(ENDPOINT, async (route) => {
      beats.push(route.request().url())
      await route.fulfill({ status: 200, body: '{}' })
    })

    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    expect(beats).toEqual([])
  })

  test('respects Do Not Track', async ({ browser }) => {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' })
    })
    const page = await context.newPage()
    const beats: string[] = []
    await page.route(ENDPOINT, async (route) => {
      beats.push(route.request().url())
      await route.fulfill({ status: 200, body: '{}' })
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    expect(beats).toEqual([])
    await context.close()
  })

  test('a failing endpoint never breaks the page', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.route(ENDPOINT, (route) => route.abort('failed'))

    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByRole('link', { name: /Open SayThrough|Try/i }).first()).toBeVisible()
    expect(errors).toEqual([])
  })
})
