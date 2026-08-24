import { expect, test } from '@playwright/test'

// Aggregate usage counting. These tests exist to hold the privacy line: the
// value of this feature is entirely dependent on it staying anonymous, so the
// assertions are about what is NOT sent as much as what is.

const ENDPOINT = /stats\.saythrough\.com/

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
  test('the marketing page counts a view and nothing else', async ({ page }) => {
    const events = await captureEvents(page)
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect.poll(() => events.length).toBeGreaterThan(0)

    expect(events[0].event).toBe('pageview')
    expect(events[0].path).toBe('/')
    // No id, session, referrer or anything else — ever.
    expect(Object.keys(events[0]).sort()).toEqual(['event', 'path'])
  })

  test('the app counts an open, with no identifier attached', async ({ page }) => {
    const events = await captureEvents(page)
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await expect.poll(() => events.length).toBeGreaterThan(0)

    const open = events.find((e) => e.event === 'app_open')
    expect(open).toBeTruthy()
    expect(Object.keys(open)).toEqual(['event'])
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
    for (const secret of ['Rowan', 'want', 'juice', 'message']) {
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

  test('the dashboard degrades when stats are unavailable', async ({ page }) => {
    await page.route(ENDPOINT, (route) => route.abort('failed'))
    await page.goto('/stats/', { waitUntil: 'networkidle' })
    await expect(page.getByText('Stats are unavailable right now.')).toBeVisible()
    // The explanation of what is counted must show regardless.
    await expect(page.getByText(/could be 1,240 people or one person/)).toBeVisible()
  })
})
