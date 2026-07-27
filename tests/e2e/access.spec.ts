import { expect, test } from '@playwright/test'
import { enterEditMode, messageBar, setupProfile } from './helpers'

// Switches the active user to a given access method via Settings.
async function setAccessMethod(
  page: import('@playwright/test').Page,
  method: 'Dwell (hover)' | 'Switch scanning',
  extraChips: string[] = [],
) {
  await enterEditMode(page)
  await page.getByLabel('Open settings').click()
  await page.getByText('How this user selects').waitFor()
  await page.getByLabel(method, { exact: true }).click()
  for (const chip of extraChips) await page.getByLabel(chip, { exact: true }).click()
  await page.getByLabel('Back to communication').click()
  await page.getByLabel('Done editing').click()
  await page.getByLabel('want', { exact: true }).waitFor()
}

test.describe('dwell access (§AM-04)', () => {
  test('hovering a button long enough selects it', async ({ page }) => {
    await setupProfile(page)
    await setAccessMethod(page, 'Dwell (hover)', ['0.5s'])

    await page.getByLabel('want', { exact: true }).hover()
    // dwell completes at 500ms → appends
    await expect(messageBar(page).getByText('want')).toBeVisible({ timeout: 3000 })
  })

  test('moving away before the dwell time cancels', async ({ page }) => {
    await setupProfile(page)
    await setAccessMethod(page, 'Dwell (hover)', ['2.5s']) // long dwell

    await page.getByLabel('you', { exact: true }).hover()
    await page.waitForTimeout(300) // well under 2.5s
    await page.getByLabel('Speak message').hover() // move away → cancel
    await page.waitForTimeout(400)
    await expect(messageBar(page).getByText('you', { exact: true })).toHaveCount(0)
  })
})

test.describe('switch scanning (§AM-05)', () => {
  // Step mode (Enter = advance, Space = select) is deterministic, so the
  // test drives the exact same advance/select logic auto mode runs on a
  // timer, without timing flakiness.
  test('step scanning selects a word via the switch keys', async ({ page }) => {
    await setupProfile(page)
    await setAccessMethod(page, 'Switch scanning', ['Step (2 switches)'])

    // scan starts on the actions group; Enter → first grid row, Space →
    // drill into the row (cursor on "I"), Space → select "I"
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await page.keyboard.press('Space')
    await expect(messageBar(page).getByText('I', { exact: true })).toBeVisible()
  })

  test('a tap selects the scan cursor, not the tapped button', async ({ page }) => {
    await setupProfile(page)
    await setAccessMethod(page, 'Switch scanning', ['Step (2 switches)'])

    await page.keyboard.press('Enter') // → grid row 0
    await page.keyboard.press('Space') // → drill, cursor on "I"
    // tapping a DIFFERENT button acts as the switch → selects the cursor
    await page.getByLabel('you', { exact: true }).click()
    await expect(messageBar(page).getByText('I', { exact: true })).toBeVisible()
    await expect(messageBar(page).getByText('you', { exact: true })).toHaveCount(0)
  })
})
