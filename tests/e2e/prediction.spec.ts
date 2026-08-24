import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, messageBar, setupProfile } from './helpers'

// §18 word prediction + the keyboard punctuation it depends on.
// Key labels are matched exactly: "space key" is a substring of
// "Backspace key", and "Insert was" of "Insert wash".

async function openKeyboard(page: Page) {
  await page.getByLabel('Keys section').click()
  await page.getByLabel('q key', { exact: true }).waitFor({ timeout: 10_000 })
}

const key = (page: Page, label: string) =>
  page.getByLabel(`${label} key`, { exact: true })

async function type(page: Page, letters: string[]) {
  for (const letter of letters) await key(page, letter).click()
}

test.describe('word prediction (§18)', () => {
  test('typing a prefix suggests words in frequency order', async ({ page }) => {
    await setupProfile(page)
    await openKeyboard(page)
    await type(page, ['w', 'a'])

    // The lexicon is fetched from /app/prediction/en.txt; give it a moment.
    await expect(page.getByLabel('Insert want', { exact: true })).toBeVisible({
      timeout: 10_000,
    })
    // Every slot filled, and every suggestion actually starts with "wa".
    const words = await page.getByLabel(/^Insert /).allInnerTexts()
    expect(words.length).toBeGreaterThanOrEqual(3)
    for (const word of words) expect(word.toLowerCase().startsWith('wa')).toBe(true)
  })

  test('tapping a suggestion inserts the whole word', async ({ page }) => {
    await setupProfile(page)
    await openKeyboard(page)
    await type(page, ['w', 'a'])

    await page.getByLabel('Insert want', { exact: true }).click({ timeout: 10_000 })
    await expect(messageBar(page).getByText('want', { exact: true })).toBeVisible()
  })

  test('a word already on a button outranks commoner corpus words', async ({
    page,
  }) => {
    await setupProfile(page)
    await openKeyboard(page)
    await type(page, ['w', 'a'])
    await expect(page.getByLabel(/^Insert /).first()).toBeVisible({ timeout: 10_000 })

    // "wash" is a seeded button label and nowhere near the top of the corpus
    // for "wa" — its presence proves the vocabulary source is wired up.
    await expect(page.getByLabel('Insert wash', { exact: true })).toBeVisible()
  })

  test('the bar holds four slots open so suggestions never move', async ({ page }) => {
    await setupProfile(page)
    await openKeyboard(page)

    const bar = page.getByLabel('Word suggestions')
    const empty = await bar.boundingBox()

    await key(page, 'w').click()
    await expect(page.getByLabel(/^Insert /).first()).toBeVisible({ timeout: 10_000 })
    const filled = await bar.boundingBox()

    // Motor planning: the row must not resize or re-center as slots fill.
    expect(filled?.width).toBe(empty?.width)
    expect(filled?.y).toBe(empty?.y)
  })

  test('prediction can be turned off in settings', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByLabel('Word prediction enabled').click()
    await page.getByLabel('Back to communication').click()
    await page.getByLabel('Done editing').click()

    await openKeyboard(page)
    await type(page, ['w', 'a'])
    await page.waitForTimeout(500)
    await expect(page.getByLabel(/^Insert /)).toHaveCount(0)
  })
})

test.describe('keyboard punctuation (§5.5)', () => {
  test('the apostrophe key can write a contraction', async ({ page }) => {
    await setupProfile(page)
    await openKeyboard(page)

    await type(page, ['d', 'o', 'n', "'", 't'])
    await key(page, 'space').click()

    await expect(messageBar(page).getByText("don't", { exact: true })).toBeVisible()
  })

  test('end punctuation attaches to the previous word', async ({ page }) => {
    await setupProfile(page)
    await openKeyboard(page)

    await type(page, ['h', 'i'])
    await key(page, 'space').click()
    // Buffer is empty, so "?" belongs on the word already in the bar.
    await key(page, '?').click()

    await expect(messageBar(page).getByText('hi?', { exact: true })).toBeVisible()
  })

  test('symbols mode reaches digits and returns to letters', async ({ page }) => {
    await setupProfile(page)
    await openKeyboard(page)

    await key(page, '?123').click()
    await key(page, '5').click()
    await key(page, 'ABC').click()
    await expect(key(page, 'q')).toBeVisible()

    await key(page, 'space').click()
    await expect(messageBar(page).getByText('5', { exact: true })).toBeVisible()
  })

  test('Done closes the keyboard and returns to the grid', async ({ page }) => {
    await setupProfile(page)
    await openKeyboard(page)
    await key(page, 'Done').click()
    await expect(page.getByLabel('want', { exact: true })).toBeVisible()
  })
})
