import { expect, test } from '@playwright/test'
import { enterEditMode, messageBar, setupProfile } from './helpers'

test.describe('vocabulary filter (§4.8)', () => {
  test('filter dims non-list words and blocks their taps', async ({ page }) => {
    await setupProfile(page)

    // create a list + add words in Settings, then select in the grid
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByText('Vocabulary Filter').waitFor()
    await page.getByLabel('New word list name').fill('Week 1')
    await page.getByLabel('Add word list').click()
    await page.getByLabel('Select words (tap them in the grid)').click()
    await page.getByText('Tap words for list: Week 1').waitFor()
    await page.getByLabel('want', { exact: true }).click()
    await page.getByLabel('Done editing').click()
    await page.getByText('Editing: Home').waitFor()
    await page.getByLabel('Done editing').click()

    await page.getByLabel('Enable vocabulary filter').click()
    await page.waitForTimeout(300)
    await page.getByLabel('want', { exact: true }).click() // in list → appends
    await page.getByLabel('go', { exact: true }).click() // not in list → inert
    await expect(messageBar(page).getByText('want')).toHaveCount(1)
    await expect(messageBar(page).getByText('go', { exact: true })).toHaveCount(0)
  })
})

test.describe('data tracking (§4.13) — consent-gated', () => {
  test('nothing is recorded until the caregiver opts in', async ({ page }) => {
    await setupProfile(page)
    // taps BEFORE opting in
    await page.getByLabel('I', { exact: true }).click()
    await page.getByLabel('Speak message').click()

    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByLabel('Data tracking enabled').click()
    await page.getByLabel('Back to communication').click()
    await page.getByLabel('Done editing').click()

    // tracked taps
    await page.getByLabel('want', { exact: true }).click()
    await page.getByLabel('more', { exact: true }).click()
    await page.getByLabel('Speak message').click()

    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByLabel('View report').click()
    await page.getByText('Most used words').waitFor()
    // scope to the report card — React Navigation keeps the Home grid
    // (which also has a "want" button) mounted behind this screen
    const words = page.getByTestId('report-words')
    await expect(words.getByText('want')).toBeVisible()
    // pre-consent "I" was excluded (only want + more were tracked)
    await expect(words.getByText('I', { exact: true })).toHaveCount(0)
  })
})

test.describe('Open Board Format interop (§14)', () => {
  test('export then re-import round-trips a page set', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByText('Backup & Restore').waitFor()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByLabel('Export active page set (.obz)').click(),
    ])
    const path = await download.path()

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByLabel('Import .obz').click(),
    ])
    await chooser.setFiles(path!)
    await expect(page.getByText('Imported "', { exact: false })).toBeVisible({
      timeout: 15_000,
    })
  })
})
