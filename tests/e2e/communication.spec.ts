import { expect, test } from '@playwright/test'
import { messageBar, setupProfile } from './helpers'

test.describe('core communication', () => {
  test('onboarding lands on Core with symbols', async ({ page }) => {
    await setupProfile(page)
    await expect(page.getByText('Home')).toBeVisible()
    // ARASAAC symbols render on core buttons
    expect(await page.locator('img').count()).toBeGreaterThan(10)
    // Core is the highlighted section, not Quick
    await expect(page.getByLabel('Core section, current')).toBeVisible()
  })

  test('tapping words builds a message, Speak does not crash', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await setupProfile(page)

    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('want', { exact: true }).click()
    await expect(messageBar(page).getByText('want')).toBeVisible()

    await page.getByLabel('Speak message').click()
    await page.waitForTimeout(300)
    expect(errors).toEqual([])
  })

  test('backspace and clear edit the message', async ({ page }) => {
    await setupProfile(page)
    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('want', { exact: true }).click()
    await page.getByLabel('Delete last word').click()
    await expect(messageBar(page).getByText('want')).toHaveCount(0)
    await expect(messageBar(page).getByText('I', { exact: true })).toBeVisible()
    await page.getByLabel('Clear message').click()
    await expect(messageBar(page).getByText('I', { exact: true })).toHaveCount(0)
  })

  test('setup step can go back to the welcome screen', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await expect(page.getByText('Who is this voice for?')).toBeVisible()
    await page.getByRole('button', { name: 'Back to welcome' }).click()
    // back on the welcome screen with the Try-it option
    await expect(page.getByRole('button', { name: 'Try SayThrough' })).toBeVisible()
  })

  test('guest mode communicates but hides editing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Try SayThrough' }).click()
    await page.getByLabel('want', { exact: true }).waitFor({ timeout: 20_000 })
    await expect(page.getByText('Demo mode', { exact: false })).toBeVisible()
    await expect(page.getByLabel('Edit mode')).toHaveCount(0)
    await page.getByLabel('want', { exact: true }).click()
    await expect(messageBar(page).getByText('want')).toBeVisible()
  })
})

test.describe('navigation & persistent core', () => {
  test('topic pages keep the core region in the same place', async ({ page }) => {
    await setupProfile(page)
    const wantHome = await page.getByLabel('want', { exact: true }).boundingBox()

    await page.getByLabel('Food, opens page').click()
    await page.getByLabel('cookie', { exact: true }).waitFor()
    const wantFood = await page.getByLabel('want', { exact: true }).boundingBox()

    // §19.5: core words are at identical positions across pages
    expect(Math.abs(wantHome!.x - wantFood!.x)).toBeLessThan(2)
    expect(Math.abs(wantHome!.y - wantFood!.y)).toBeLessThan(2)

    await page.getByLabel('Back').click()
    await expect(page.getByLabel('Food, opens page')).toBeVisible()
  })

  test('search jumps to a word on its page', async ({ page }) => {
    await setupProfile(page)
    await page.getByRole('button', { name: 'Search vocabulary' }).click()
    await page.getByRole('textbox', { name: 'Search vocabulary' }).fill('cook')
    await page.getByLabel('Go to cookie on Food').click()
    await expect(page.getByLabel('cookie', { exact: true })).toBeVisible()
  })
})
