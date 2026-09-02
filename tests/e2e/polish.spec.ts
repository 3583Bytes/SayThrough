import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, messageBar, setupProfile } from './helpers'

// §19.7 Polish. The unit tests cover the paradigms; these cover what only a
// real build shows — that the language choice produces a Polish app, that the
// case forms reach the message bar, and that the grammatical-gender setting
// actually changes which past-tense form leads.

async function setupPolishProfile(page: Page, name = 'Test') {
  await page.goto('/app/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up SayThrough' }).click()
  await page.getByRole('button', { name: 'Polski' }).click()
  await page.getByLabel('Imię użytkownika').fill(name)
  await page.getByRole('button', { name: 'Zakończ konfigurację' }).click()
  await page.getByLabel('chcę', { exact: true }).waitFor({ timeout: 20_000 })
}

/** Long-press a grid button to open the word-forms popup. */
async function longPress(page: Page, label: string) {
  const button = page.getByLabel(label, { exact: true })
  await button.waitFor()
  const box = (await button.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()
}

test.describe('Polish setup (§19.7)', () => {
  test('choosing Polski translates the rest of onboarding', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await expect(page.getByText('Who is this voice for?')).toBeVisible()

    await page.getByRole('button', { name: 'Polski' }).click()

    await expect(page.getByText('Dla kogo jest ten głos?')).toBeVisible()
    await expect(page.getByText('Słownictwo początkowe')).toBeVisible()
    await expect(page.getByText('Who is this voice for?')).toHaveCount(0)
  })

  test('lands on the Polish board with Polish chrome', async ({ page }) => {
    await setupPolishProfile(page)

    // The persistent core, including `się` — the reflexive particle earns a
    // core cell in Polish and has no counterpart on the other two boards.
    for (const word of ['ja', 'ty', 'chcę', 'jest', 'mam', 'się', 'nie']) {
      await expect(page.getByLabel(word, { exact: true })).toBeVisible()
    }
    await expect(page.getByLabel('Start')).toBeVisible()
    await expect(page.getByLabel('Szukaj w słownictwie')).toBeVisible()
    await expect(page.getByLabel('Powiedz wiadomość')).toBeVisible()
  })

  test('builds and speaks a Polish sentence', async ({ page }) => {
    await setupPolishProfile(page)
    await page.getByLabel('ja', { exact: true }).click()
    await page.getByLabel('chcę', { exact: true }).click()
    await expect(messageBar(page)).toContainText('chcę')
    await page.getByLabel('Powiedz wiadomość').click()
    await expect(messageBar(page)).toContainText('chcę')
  })

  test('navigates into a Polish topic page and back', async ({ page }) => {
    await setupPolishProfile(page)
    await page.getByLabel('Jedzenie, opens page').click()
    await expect(page.getByLabel('jeść', { exact: true })).toBeVisible()
    await expect(page.getByLabel('chcę', { exact: true })).toBeVisible()
    await page.getByLabel('Wstecz', { exact: true }).click()
    await expect(page.getByLabel('Jedzenie, opens page')).toBeVisible()
  })
})

test.describe('Polish word forms (§19.7)', () => {
  test('long-press a noun offers its cases', async ({ page }) => {
    await setupPolishProfile(page)
    await page.getByLabel('Picie, opens page').click()
    await longPress(page, 'woda')

    await expect(page.getByText('Formy słowa „woda”')).toBeVisible()
    // Case is what Polish needs and neither other engine produces.
    await expect(page.getByLabel('Wstaw wodę', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Wstaw wody', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Wstaw wodzie', { exact: true })).toBeVisible()

    // `chcę wodę` — accusative, the form the verb governs.
    await page.getByLabel('Wstaw wodę', { exact: true }).click()
    await expect(messageBar(page)).toContainText('wodę')
  })

  test('long-press a verb offers its person forms', async ({ page }) => {
    await setupPolishProfile(page)
    await page.getByLabel('Czynności, opens page').click()
    await longPress(page, 'czytać')

    await expect(page.getByLabel('Wstaw czytam', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Wstaw czytasz', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Wstaw czytamy', { exact: true })).toBeVisible()
    await page.getByLabel('Wstaw czytam', { exact: true }).click()
    await expect(messageBar(page)).toContainText('czytam')
  })

  test('an adjective agrees with the noun already in the bar', async ({ page }) => {
    await setupPolishProfile(page)
    await page.getByLabel('Picie, opens page').click()
    await page.getByLabel('woda', { exact: true }).click()
    await page.getByLabel('Wstecz', { exact: true }).click()

    await page.getByLabel('Opisy, opens page').click()
    await longPress(page, 'zimny')

    // `woda` is feminine, so `zimna` leads and says so.
    await expect(page.getByLabel('Wstaw zimna', { exact: true })).toBeVisible()
    await page.getByLabel('Wstaw zimna', { exact: true }).click()
    await expect(messageBar(page)).toContainText('zimna')
  })
})

// The setting that exists only because Polish grammar makes the board say
// something about its own user.
test.describe('grammatical gender (§19.7)', () => {
  // The shared enterEditMode helper looks for the English labels, so a
  // Polish profile needs its own.
  async function enterPolishEditMode(page: Page) {
    await page.getByLabel('Tryb edycji').click()
    await page.getByText(/^Edytujesz: /).waitFor({ timeout: 5_000 })
  }

  async function setGender(page: Page, label: string) {
    await enterPolishEditMode(page)
    await page.getByLabel('Otwórz ustawienia').click()
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.getByLabel('Wróć do komunikacji').click()
    await page.getByLabel('Zakończ edycję').click()
  }

  test('offers both past forms until a gender is chosen', async ({ page }) => {
    await setupPolishProfile(page)
    await page.getByLabel('Czynności, opens page').click()
    await longPress(page, 'czytać')
    // Neither leads; both are labelled for who would say them.
    await expect(page.getByLabel('Wstaw czytałem', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Wstaw czytałam', { exact: true })).toBeVisible()
    await expect(page.getByText('wczoraj (on)')).toBeVisible()
    await expect(page.getByText('wczoraj (ona)')).toBeVisible()
  })

  test('a feminine profile gets the feminine past first', async ({ page }) => {
    await setupPolishProfile(page)
    await setGender(page, 'Żeński')

    await page.getByLabel('Czynności, opens page').click()
    await longPress(page, 'czytać')

    // Both forms stay available — the setting orders them, never removes one.
    await expect(page.getByLabel('Wstaw czytałam', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Wstaw czytałem', { exact: true })).toBeVisible()
    // ...and the feminine is the one presented as simply "yesterday".
    await expect(page.getByText('wczoraj (rodzaj męski)')).toBeVisible()

    await page.getByLabel('Wstaw czytałam', { exact: true }).click()
    await expect(messageBar(page)).toContainText('czytałam')
  })

  test('the control is hidden for a language that does not mark it', async ({ page }) => {
    await setupProfile(page)
    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    // An English profile has no use for it and should not be asked.
    await expect(page.getByText('Grammatical gender')).toHaveCount(0)
  })
})

test.describe('Polish symbol picker (§19.7)', () => {
  // The pictograms are the same images in every language; their KEYWORDS are
  // not. The picker searched an English-only index, so customising a Polish
  // board meant guessing the English word for the picture you wanted.
  async function openPicker(page: Page) {
    await setupPolishProfile(page)
    await page.getByLabel('Tryb edycji').click()
    await page.getByText(/^Edytujesz: /).waitFor({ timeout: 5_000 })
    await page.getByLabel('chcę', { exact: true }).click()
    await page.getByLabel('chcę', { exact: true }).click() // 2nd tap → editor
    await page.getByLabel('Zmień symbol').click()
    await page.getByLabel('Szukaj symboli').waitFor()
  }

  test('finds a symbol by its Polish keyword', async ({ page }) => {
    await openPicker(page)
    await page.getByLabel('Szukaj symboli').fill('woda')
    await expect(page.getByLabel('Symbol woda').first()).toBeVisible({ timeout: 15_000 })
  })

  test('matches without the diacritics a hurried caregiver skips', async ({ page }) => {
    await openPicker(page)
    await page.getByLabel('Szukaj symboli').fill('jesc')
    await expect(page.getByLabel('Symbol jeść').first()).toBeVisible({ timeout: 15_000 })
  })
})
