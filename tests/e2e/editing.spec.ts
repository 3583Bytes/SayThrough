import { expect, test } from '@playwright/test'
import { enterEditMode, setupProfile } from './helpers'

test.describe('edit mode', () => {
  test('add a button, use it, and undo the delete', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)

    await page.getByLabel('Add button at row 5, column 6').click()
    await page.getByLabel('Button label').fill('juice')
    await page.getByLabel('Save button').click()
    await page.getByLabel('Done editing').click()
    await expect(page.getByLabel('juice', { exact: true })).toBeVisible()

    // delete it, then undo brings it back
    await enterEditMode(page)
    await page.getByLabel('juice', { exact: true }).click()
    await page.getByLabel('juice', { exact: true }).click() // 2nd tap → editor
    await page.getByLabel('Delete button').click()
    await expect(page.getByLabel('juice', { exact: true })).toHaveCount(0)
    await page.getByLabel('Undo').click()
    await expect(page.getByLabel('juice', { exact: true })).toBeVisible()
  })

  test('create a linked page carrying the core region', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Add button at row 5, column 6').click()
    await page.getByLabel('Button label').fill('Games')
    await page.getByLabel('Link button to a page').click()
    await page.getByLabel('New page name').fill('Games')
    await page.getByLabel('Create page and link').click()
    await page.getByLabel('Save button').click()
    await page.getByLabel('Done editing').click()

    await page.getByLabel('Games, opens page').click()
    // §19.2: new page carries the persistent core words
    await expect(page.getByLabel('want', { exact: true })).toBeVisible()
    await expect(page.getByLabel('help', { exact: true })).toBeVisible()
  })

  test('delete a page repairs buttons that linked to it', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Add button at row 5, column 6').click()
    await page.getByLabel('Button label').fill('Temp')
    await page.getByLabel('Link button to a page').click()
    await page.getByLabel('New page name').fill('Temp')
    await page.getByLabel('Create page and link').click()
    await page.getByLabel('Save button').click()
    await page.getByLabel('Done editing').click()
    await page.getByLabel('Temp, opens page').waitFor()

    await page.getByLabel('Temp, opens page').click() // use mode → navigate to Temp
    await enterEditMode(page) // Page options lives in the edit bar
    await page.getByText('Editing: Temp').waitFor()
    await page.getByLabel('Page options').click()
    await page.getByLabel('Delete page').click()
    await page.getByText('Editing: Home').waitFor() // delete navigates home
    await page.getByLabel('Done editing').click()
    // the link became a plain word — tapping appends instead of navigating
    await page.getByLabel('Temp', { exact: true }).click()
    await expect(page.locator('[aria-live="polite"]').getByText('Temp')).toBeVisible()
  })
})
