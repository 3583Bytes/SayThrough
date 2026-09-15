import { expect, test, type Page } from '@playwright/test'
import { messageBar } from './helpers'

// §19.7 Italian. The unit tests cover the paradigms and the contraction table;
// these cover what only a real build shows — that the language choice produces
// an Italian app, and that tapping `a` then `il` on the actual board puts ONE
// word in the message bar.

async function setupItalianProfile(page: Page, name = 'Prova') {
  await page.goto('/app/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up SayThrough' }).click()
  await page.getByRole('button', { name: 'Italiano' }).click()
  await page.getByLabel('Nome utente').fill(name)
  await page.getByRole('button', { name: 'Termina la configurazione' }).click()
  await page.getByLabel('voglio', { exact: true }).waitFor({ timeout: 20_000 })
}

async function longPress(page: Page, label: string) {
  const button = page.getByLabel(label, { exact: true })
  await button.waitFor()
  const box = (await button.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await page.mouse.up()
}

test.describe('Italian setup (§19.7)', () => {
  test('choosing Italiano translates the rest of onboarding', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await expect(page.getByText('Who is this voice for?')).toBeVisible()

    await page.getByRole('button', { name: 'Italiano' }).click()

    await expect(page.getByText('Per chi è questa voce?')).toBeVisible()
    await expect(page.getByText('Vocabolario iniziale')).toBeVisible()
    await expect(page.getByText('Who is this voice for?')).toHaveCount(0)
  })

  test('lands on the Italian board with Italian chrome', async ({ page }) => {
    await setupItalianProfile(page)
    // Core words authored for Italian, not translated from English.
    for (const word of ['io', 'tu', 'voglio', 'mi piace', 'aiuto', 'basta']) {
      await expect(page.getByLabel(word, { exact: true })).toBeVisible()
    }
    await expect(page.getByLabel('Home')).toBeVisible()
    await expect(page.getByLabel('Cerca nel vocabolario')).toBeVisible()
    await expect(page.getByLabel('Pronuncia il messaggio')).toBeVisible()
  })

  test('navigates into an Italian topic page and back', async ({ page }) => {
    await setupItalianProfile(page)
    await page.getByLabel('Sentimenti, opens page').click()
    await expect(page.getByLabel('felice', { exact: true })).toBeVisible()
    await page.getByLabel('Indietro', { exact: true }).click()
    await expect(page.getByLabel('Sentimenti, opens page')).toBeVisible()
  })
})

test.describe('Italian contractions (§19.7)', () => {
  // `vado a il parco` is not clumsy, it is wrong — `al parco` is the only
  // correct form, and a board that speaks the two words separately produces
  // broken Italian every time with no way for the user to fix it.
  test('tapping a then il puts a single fused word in the bar', async ({ page }) => {
    await setupItalianProfile(page)
    await page.getByLabel('Paroline, opens page').click()
    await page.getByLabel('a', { exact: true }).click()
    await page.getByLabel('il', { exact: true }).click()

    await expect(messageBar(page)).toContainText('al')
    await expect(messageBar(page)).not.toContainText('a il')
  })

  test('the fused form behaves as ONE word for delete-last', async ({ page }) => {
    // This is why the fusion happens at append time rather than at render:
    // `al` is genuinely one word, so backspace has to remove all of it.
    await setupItalianProfile(page)
    await page.getByLabel('Paroline, opens page').click()
    await page.getByLabel('a', { exact: true }).click()
    await page.getByLabel('il', { exact: true }).click()
    await expect(messageBar(page)).toContainText('al')

    await page.getByLabel('Cancella l’ultima parola').click()
    await expect(messageBar(page)).not.toContainText('al')
    // Back to the empty state — and that placeholder is itself localised,
    // which it was not until this language was added.
    await expect(messageBar(page)).toContainText('Tocca i pulsanti per comporre un messaggio')
  })

  test('di + la fuses to della', async ({ page }) => {
    await setupItalianProfile(page)
    // `di` is in the persistent core precisely because of this.
    await page.getByLabel('di', { exact: true }).click()
    await page.getByLabel('Paroline, opens page').click()
    await page.getByLabel('la', { exact: true }).click()

    await expect(messageBar(page)).toContainText('della')
    await expect(messageBar(page)).not.toContainText('di la')
  })
})

test.describe('Italian word forms (§19.7)', () => {
  test('long-press a verb offers all six persons', async ({ page }) => {
    // Italian has not collapsed `voi` the way Brazilian usage collapsed
    // `você`, so the popup carries six rather than four.
    await setupItalianProfile(page)
    await page.getByLabel('Cibo, opens page').click()
    await longPress(page, 'mangiare')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    for (const form of ['mangio', 'mangi', 'mangia', 'mangiamo', 'mangiate', 'mangiano']) {
      await expect(dialog.getByText(form, { exact: true })).toBeVisible()
    }
    // …and the spelling rule held: `mangi`, never `mangii`.
    await expect(dialog.getByText('mangii', { exact: true })).toHaveCount(0)
  })

  test('an adjective agrees with the noun already in the bar', async ({ page }) => {
    await setupItalianProfile(page)
    await page.getByLabel('Luoghi, opens page').click()
    await page.getByLabel('casa', { exact: true }).click()
    await page.getByLabel('Indietro', { exact: true }).click()

    await page.getByLabel('Descrivere, opens page').click()
    await longPress(page, 'piccolo')

    // `casa` is feminine, so the agreeing form leads.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('piccola', { exact: true })).toBeVisible()
  })
})
