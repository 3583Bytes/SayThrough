import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, setupProfile } from './helpers'

// §19 grid sizes and vocabulary levels.

async function openSettings(page: Page) {
  await enterEditMode(page)
  await page.getByLabel('Open settings').click()
  await page.getByText('Profile').first().waitFor()
}

async function leaveSettings(page: Page) {
  await page.getByLabel('Back to communication').click()
  await page.getByLabel('Done editing').click()
}

/** Grid position of a button, for proving words do not move. */
async function boxOf(page: Page, label: string) {
  const box = await page.getByLabel(label, { exact: true }).boundingBox()
  expect(box).toBeTruthy()
  return { x: Math.round(box!.x), y: Math.round(box!.y) }
}

test.describe('vocabulary levels (§19)', () => {
  test('Basic hides later words while keeping core', async ({ page }) => {
    await setupProfile(page)
    // Full board by default — an advanced word is present.
    await expect(page.getByLabel('School, opens page')).toBeVisible()

    await openSettings(page)
    await page.getByLabel('Basic', { exact: true }).click()
    await leaveSettings(page)

    // Core survives every level.
    await expect(page.getByLabel('want', { exact: true })).toBeVisible()
    await expect(page.getByLabel('help', { exact: true })).toBeVisible()
    // A level-2 topic is not introduced yet.
    await expect(page.getByLabel('School, opens page')).toHaveCount(0)
    // A level-1 topic still is.
    await expect(page.getByLabel('Food, opens page')).toBeVisible()
  })

  test('raising the level reveals words without moving any', async ({ page }) => {
    await setupProfile(page)
    await openSettings(page)
    await page.getByLabel('Basic', { exact: true }).click()
    await leaveSettings(page)

    const before = {
      want: await boxOf(page, 'want'),
      help: await boxOf(page, 'help'),
      Food: await boxOf(page, 'Food, opens page'),
    }

    await openSettings(page)
    await page.getByLabel('Full', { exact: true }).click()
    await leaveSettings(page)

    // §19.1: nothing already learned may shift when more words appear.
    expect(await boxOf(page, 'want')).toEqual(before.want)
    expect(await boxOf(page, 'help')).toEqual(before.help)
    expect(await boxOf(page, 'Food, opens page')).toEqual(before.Food)
    await expect(page.getByLabel('School, opens page')).toBeVisible()
  })

  test('a level applies inside topic pages too', async ({ page }) => {
    await setupProfile(page)
    await page.getByLabel('Food, opens page').click()
    await expect(page.getByLabel('cereal', { exact: true })).toBeVisible()
    const eatBefore = await boxOf(page, 'eat')

    await openSettings(page)
    await page.getByLabel('Basic', { exact: true }).click()
    // Leaving Settings returns to the page we were on — still Food.
    await leaveSettings(page)

    await expect(page.getByLabel('eat', { exact: true })).toBeVisible()
    await expect(page.getByLabel('cereal', { exact: true })).toHaveCount(0)
    // Still exactly where it was on the full board.
    expect(await boxOf(page, 'eat')).toEqual(eatBefore)
    // And the way back is never hidden.
    await expect(page.getByLabel('Back', { exact: true })).toBeVisible()
  })
})

test.describe('grid sizes (§19.2)', () => {
  test('a simplified board ships and can be selected', async ({ page }) => {
    await setupProfile(page)
    await openSettings(page)

    await page.getByLabel('Core Vocabulary (Simplified)').click()
    await leaveSettings(page)

    // 3×4 core: the six starter words, and none of the 5×6-only core.
    await expect(page.getByLabel('want', { exact: true })).toBeVisible()
    await expect(page.getByLabel('more', { exact: true })).toBeVisible()
    await expect(page.getByLabel('feel', { exact: true })).toHaveCount(0)
    // Its own topics are reachable.
    await expect(page.getByLabel('Food, opens page')).toBeVisible()
  })

  test('the Core button returns to the user’s own board, not the 5×6 one', async ({
    page,
  }) => {
    await setupProfile(page)
    await openSettings(page)
    await page.getByLabel('Core Vocabulary (Simplified)').click()
    await leaveSettings(page)

    await page.getByLabel('Food, opens page').click()
    await page.getByLabel('Core section').click()

    // Back on the simplified home page — NOT thrown onto the 5×6 layout.
    await expect(page.getByLabel('more', { exact: true })).toBeVisible()
    await expect(page.getByLabel('feel', { exact: true })).toHaveCount(0)
  })
})

test.describe('the expanded board (§19.2)', () => {
  test('offers a wider core than the standard board', async ({ page }) => {
    await setupProfile(page)
    // 5×6 core does not include these; the 24-word core does.
    await expect(page.getByLabel('need', { exact: true })).toHaveCount(0)

    await openSettings(page)
    await page.getByLabel('Core Vocabulary (Expanded)').click()
    await leaveSettings(page)

    for (const word of ['want', 'need', 'me', 'my', 'what', 'done']) {
      await expect(page.getByLabel(word, { exact: true })).toBeVisible()
    }
  })

  test('carries its wider core onto topic pages unchanged', async ({ page }) => {
    await setupProfile(page)
    await openSettings(page)
    await page.getByLabel('Core Vocabulary (Expanded)').click()
    await leaveSettings(page)

    const before = await boxOf(page, 'need')
    await page.getByLabel('Food, opens page').click()
    await expect(page.getByLabel('rice', { exact: true })).toBeVisible()

    // §19.6: identical position across pages, on every authored size.
    expect(await boxOf(page, 'need')).toEqual(before)
  })
})
