import { expect, test } from '@playwright/test'
import { enterEditMode, messageBar, setupProfile } from './helpers'

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
    // clear-all now lives in the ⋯ message-actions sheet, not on the bar
    await page.getByLabel('Message actions').click()
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
    // no Back on the home page — there's nowhere to go back to
    await expect(page.getByLabel('Back')).toHaveCount(0)

    await page.getByLabel('Food, opens page').click()
    await page.getByLabel('cookie', { exact: true }).waitFor()
    const wantFood = await page.getByLabel('want', { exact: true }).boundingBox()

    // §19.5: core words are at identical positions across pages
    expect(Math.abs(wantHome!.x - wantFood!.x)).toBeLessThan(2)
    expect(Math.abs(wantHome!.y - wantFood!.y)).toBeLessThan(2)

    // a clear, labeled Back appears inside a category to return to it
    await expect(page.getByLabel('Back')).toBeVisible()
    await page.getByLabel('Back').click()
    await expect(page.getByLabel('Food, opens page')).toBeVisible()
    await expect(page.getByLabel('Back')).toHaveCount(0)
  })

  test('search jumps to a word on its page', async ({ page }) => {
    await setupProfile(page)
    await page.getByRole('button', { name: 'Search vocabulary' }).click()
    await page.getByRole('textbox', { name: 'Search vocabulary' }).fill('cook')
    await page.getByLabel('Go to cookie on Food').click()
    await expect(page.getByLabel('cookie', { exact: true })).toBeVisible()
  })
})

test.describe('sentence-bar interactions & post-speak options', () => {
  test('long-press a word removes just that word', async ({ page }) => {
    await setupProfile(page)
    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('want', { exact: true }).click()
    await page.getByLabel('more', { exact: true }).click()
    const bar = messageBar(page)
    await expect(bar.getByText('want', { exact: true })).toBeVisible()

    // press-and-hold the middle word → removes only it (tap would speak)
    await bar.getByText('want', { exact: true }).click({ delay: 700 })
    await expect(bar.getByText('want', { exact: true })).toHaveCount(0)
    await expect(bar.getByText('I', { exact: true })).toBeVisible()
    await expect(bar.getByText('more', { exact: true })).toBeVisible()
  })

  test('return-home-after-speaking jumps back to the categories', async ({
    page,
  }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByLabel('Return to home after speaking').click()
    await page.getByLabel('Back to communication').click()
    await page.getByLabel('Done editing').click()

    await page.getByLabel('Food, opens page').click()
    await page.getByLabel('cookie', { exact: true }).click()
    await page.getByLabel('Speak message').click()

    // back on the home page — category buttons are visible again
    await expect(page.getByLabel('Food, opens page')).toBeVisible()
  })

  test('clear-after-speaking empties the sentence bar', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByLabel('Clear message after speaking').click()
    await page.getByLabel('Back to communication').click()
    await page.getByLabel('Done editing').click()

    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('want', { exact: true }).click()
    await expect(messageBar(page).getByText('want', { exact: true })).toBeVisible()

    await page.getByLabel('Speak message').click()
    await expect(messageBar(page).getByText('want', { exact: true })).toHaveCount(0)
    await expect(messageBar(page).getByText('I', { exact: true })).toHaveCount(0)
  })
})

test.describe('quick-fire buttons & message history', () => {
  test('attention + emergency buttons are present and non-destructive', async ({
    page,
  }) => {
    await setupProfile(page)
    await expect(page.getByLabel('Get attention')).toBeVisible()
    await expect(page.getByLabel('Speak emergency phrase')).toBeVisible()

    // tapping them must not break message building
    await page.getByLabel('Speak emergency phrase').click()
    await page.getByLabel('Get attention').click()
    await page.getByLabel('I', { exact: true }).click()
    await expect(messageBar(page).getByText('I', { exact: true })).toBeVisible()
  })

  test('settings can hide the emergency and attention buttons', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByLabel('Emergency phrase').fill('')
    await page.getByLabel('Attention bell').click() // toggle off
    await page.getByLabel('Back to communication').click()
    await page.getByLabel('Done editing').click()

    await expect(page.getByLabel('Speak emergency phrase')).toHaveCount(0)
    await expect(page.getByLabel('Get attention')).toHaveCount(0)
  })

  test('a spoken message can be recalled from history into the bar', async ({
    page,
  }) => {
    await setupProfile(page)
    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('want', { exact: true }).click()
    await page.getByLabel('Speak message').click()

    // clear the bar so recall is observable
    await page.getByLabel('Message actions').click()
    await page.getByLabel('Clear message').click()
    await expect(messageBar(page).getByText('want', { exact: true })).toHaveCount(0)

    // reopen actions → Recent messages → tap the phrase to reload it
    await page.getByLabel('Message actions').click()
    await page.getByLabel('Recent messages').click()
    await page.getByLabel('Use phrase: I want').click()
    await expect(messageBar(page).getByText('I', { exact: true })).toBeVisible()
    await expect(messageBar(page).getByText('want', { exact: true })).toBeVisible()
  })
})
