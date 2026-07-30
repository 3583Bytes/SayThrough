import { expect, test } from '@playwright/test'
import { enterEditMode, messageBar, setupProfile } from './helpers'

test.describe('themes (§6.1)', () => {
  test('dark mode applies, persists across reload, and app still works', async ({
    page,
  }) => {
    await setupProfile(page)

    // default (light): app screen background is white
    const screen = page.getByTestId('app-screen')
    await expect(async () => {
      const bg = await screen.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(bg).toBe('rgb(255, 255, 255)')
    }).toPass()

    // switch to Dark in Settings
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByText('Appearance').waitFor()
    await page.getByLabel('Dark', { exact: true }).click()
    await page.getByLabel('Back to communication').click()
    await page.getByLabel('Done editing').click()
    await page.getByLabel('want', { exact: true }).waitFor()

    // screen is now dark (#121212)
    await expect(async () => {
      const bg = await screen.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(bg).toBe('rgb(18, 18, 18)')
    }).toPass()

    // persists across reload AND communication still works in dark
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByLabel('want', { exact: true }).waitFor({ timeout: 20_000 })
    const bgAfter = await page
      .getByTestId('app-screen')
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bgAfter).toBe('rgb(18, 18, 18)')

    await page.getByLabel('I', { exact: true }).click()
    await expect(messageBar(page).getByText('I', { exact: true })).toBeVisible()
  })
})
