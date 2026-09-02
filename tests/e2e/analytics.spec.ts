import { expect, test } from '@playwright/test'

// Aggregate usage counting. These tests exist to hold the privacy line: the
// value of this feature is entirely dependent on it staying anonymous, so the
// assertions are about what is NOT sent as much as what is.

const ENDPOINT = /dashboard\.3583bytes\.com/

async function captureEvents(page: import('@playwright/test').Page) {
  const events: any[] = []
  await page.route(ENDPOINT, async (route) => {
    const raw = route.request().postData()
    if (raw) events.push(JSON.parse(raw))
    await route.fulfill({ status: 204, body: '' })
  })
  return events
}

test.describe('usage counting', () => {
  test('the marketing page reports in, with a throwaway id', async ({ page }) => {
    const events = await captureEvents(page)
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect.poll(() => events.length).toBeGreaterThan(0)

    expect(events[0].game_name).toBe('SayThrough Site')
    // Random per tab, never persisted beyond the session.
    expect(events[0].player_id).toMatch(/^web-[0-9a-f]{16}$/)
    expect(Object.keys(events[0]).sort()).toEqual(['game_name', 'player_id'])
  })

  test('the id is not stable across sessions', async ({ browser }) => {
    const ids: string[] = []
    for (let i = 0; i < 2; i++) {
      const context = await browser.newContext() // fresh session storage
      const page = await context.newPage()
      await page.route(ENDPOINT, async (route) => {
        const body = route.request().postDataJSON()
        if (body?.player_id) ids.push(body.player_id)
        await route.fulfill({ status: 200, body: '{"status":"ok"}' })
      })
      await page.goto('/', { waitUntil: 'networkidle' })
      await expect.poll(() => ids.length).toBeGreaterThan(i)
      await context.close()
    }
    expect(ids[0]).not.toBe(ids[1])
  })

  test('the app reports in under its own name', async ({ page }) => {
    const events = await captureEvents(page)
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await expect.poll(() => events.length).toBeGreaterThan(0)

    const beat = events.find((e) => e.game_name === 'SayThrough App')
    expect(beat).toBeTruthy()
    expect(beat.player_id).toMatch(/^app-[0-9a-f]{16}$/)
    expect(Object.keys(beat).sort()).toEqual(['game_name', 'player_id'])
  })

  test('never sends anything the user said or typed', async ({ page }) => {
    const events = await captureEvents(page)
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await page.getByLabel('User name').fill('Rowan')
    await page.getByRole('button', { name: 'Finish setup' }).click()
    await page.getByLabel('want', { exact: true }).waitFor({ timeout: 20_000 })

    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('want', { exact: true }).click()
    await page.getByLabel('Speak message').click()
    await page.waitForTimeout(800)

    const all = JSON.stringify(events)
    for (const secret of ['Rowan', 'want', 'juice']) {
      expect(all).not.toContain(secret)
    }
  })

  test('the opt-out stops counting on both surfaces', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.evaluate(() =>
      localStorage.setItem('saythrough-usage-counting', 'off'),
    )

    const events = await captureEvents(page)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    expect(events).toEqual([])

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    expect(events).toEqual([])
  })

  test('a dead stats endpoint never breaks the app', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.route(ENDPOINT, (route) => route.abort('failed'))

    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await page.getByLabel('User name').fill('Tester')
    await page.getByRole('button', { name: 'Finish setup' }).click()
    await expect(page.getByLabel('want', { exact: true })).toBeVisible({ timeout: 20_000 })
    expect(errors).toEqual([])
  })


})

// The marketing site makes promises to families and SLPs choosing an AAC
// system. These pin the claims that were found to be false in an audit, so a
// future edit cannot quietly reintroduce them.
test.describe('marketing claims stay true', () => {
  test('does not advertise features that do not exist', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const text = (await page.locator('body').innerText()).toLowerCase()

    // Printable/PDF boards: backlog Tier 2, not started.
    expect(text).not.toContain('printable')
    // Modeling mode: isModeling() is hardcoded false.
    expect(text).not.toMatch(/\bmodeling\b/)
    // Mulberry symbols are not in the build yet.
    expect(text).not.toContain('16,500')
  })

  test('the symbol count it advertises is actually served', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const text = await page.locator('body').innerText()
    // Whatever figure the page quotes must be one the site can actually back
    // up — "13,800+" was an overclaim against a 13,799-image library.
    const quoted = text.match(/([\d,]+)\+ symbols/)
    if (!quoted) return
    const claimed = Number(quoted[1].replace(/,/g, ''))
    const index = await (await request.get('/app/symbolIndex/en.json')).json()
    expect(index.length).toBeGreaterThanOrEqual(claimed)
    // and a sample of them must really resolve
    for (const entry of [index[0], index[Math.floor(index.length / 2)], index[index.length - 1]]) {
      const id = entry.id.split(':')[1]
      expect((await request.get(`/app/symbols/arasaac/${id}.webp`)).status()).toBe(200)
    }
  })

  test('quotes vocabulary sizes that match the shipped boards', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const text = await page.locator('body').innerText()
    const sizes = require('../../src/data/coreWords.json').sizes as Record<string, any>
    const totals = Object.values(sizes).map(
      (v) => v.core.length + Object.values<any[]>(v.topics).reduce((n, w) => n + w.length, 0),
    )
    // Whatever numbers the page quotes must be real board sizes.
    for (const quoted of text.match(/\b(\d{2,4})-word\b/g) ?? []) {
      const n = Number(quoted.replace('-word', ''))
      expect(totals).toContain(n)
    }
  })

  test('advertises what does ship', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const text = (await page.locator('body').innerText()).toLowerCase()
    for (const shipped of ['word prediction', 'board sizes', 'full backup', 'quick phrases']) {
      expect(text).toContain(shipped)
    }
  })
})

test.describe('contact page', () => {
  test('shows a working email address without a click', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'networkidle' })
    const link = page.getByRole('link', { name: 'contact@3583bytes.com' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', 'mailto:contact@3583bytes.com')
  })

  test('the address is real text, not an image', async ({ page }) => {
    // An image of an email is invisible to screen readers — unacceptable for
    // an accessibility product. It must be selectable, copyable text.
    await page.goto('/contact/', { waitUntil: 'networkidle' })
    const slot = page.locator('#email-slot')
    await expect(slot).toContainText('contact@3583bytes.com')
    expect(await slot.locator('img').count()).toBe(0)
  })

  test('the address is absent from the served HTML', async ({ request }) => {
    // What a scraper that does not run JS actually receives.
    const html = await (await request.get('/contact/')).text()
    expect(html).not.toContain('contact@3583bytes.com')
    expect(html.toLowerCase()).not.toContain('mailto:contact')
  })

  test('is reachable from the rest of the site', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Contact' }).click()
    await expect(page.getByRole('heading', { name: 'Get in touch' })).toBeVisible()
  })

  test('warns against sending personal information', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'networkidle' })
    await expect(page.getByText(/don't send personal information/i)).toBeVisible()
    await expect(page.getByText(/not a secure or HIPAA-covered channel/i)).toBeVisible()
  })
})
