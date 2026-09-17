import { expect, test, type Page } from '@playwright/test'
import { messageBar } from './helpers'

// §19.7 German — the first language here that is not a port of an existing
// engine. The unit tests cover the paradigms; these cover what only a real
// build shows: that the language choice produces a German app, that the
// separable-verb decision survives contact with the actual board, and that
// tapping `in` then `dem` puts one word in the bar.

async function setupGermanProfile(page: Page, name = 'Test') {
  await page.goto('/app/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up SayThrough' }).click()
  await page.getByRole('button', { name: 'Deutsch' }).click()
  await page.getByLabel('Name der Person').fill(name)
  await page.getByRole('button', { name: 'Einrichtung abschließen' }).click()
  await page.getByLabel('will', { exact: true }).waitFor({ timeout: 20_000 })
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

test.describe('German setup (§19.7)', () => {
  test('choosing Deutsch translates the rest of onboarding', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await expect(page.getByText('Who is this voice for?')).toBeVisible()

    await page.getByRole('button', { name: 'Deutsch' }).click()

    await expect(page.getByText('Für wen ist diese Stimme?')).toBeVisible()
    await expect(page.getByText('Start-Wortschatz')).toBeVisible()
    await expect(page.getByText('Who is this voice for?')).toHaveCount(0)
  })

  test('lands on the German board with the modals in core', async ({ page }) => {
    await setupGermanProfile(page)
    // `will` and `mag` hold core cells specifically so that a separable verb
    // can follow them intact — see morphology.de.ts.
    for (const word of ['ich', 'du', 'will', 'mag', 'Hilfe', 'stopp']) {
      await expect(page.getByLabel(word, { exact: true })).toBeVisible()
    }
    await expect(page.getByLabel('Start')).toBeVisible()
    await expect(page.getByLabel('Nachricht sprechen')).toBeVisible()
  })

  test('capitalises its nouns, because in German that is spelling', async ({ page }) => {
    await setupGermanProfile(page)
    await page.getByLabel('Essen, opens page').click()
    // A lowercase noun on the board would be teaching a spelling error.
    for (const noun of ['Brot', 'Apfel', 'Keks']) {
      await expect(page.getByLabel(noun, { exact: true })).toBeVisible()
    }
  })
})

test.describe('German contractions (§19.7)', () => {
  test('in + dem fuses to im', async ({ page }) => {
    await setupGermanProfile(page)
    await page.getByLabel('Kleine, opens page').click()
    await page.getByLabel('in', { exact: true }).click()
    await page.getByLabel('dem', { exact: true }).click()

    await expect(messageBar(page)).toContainText('im')
    await expect(messageBar(page)).not.toContainText('in dem')
  })

  test('the fused form behaves as ONE word for delete-last', async ({ page }) => {
    await setupGermanProfile(page)
    await page.getByLabel('Kleine, opens page').click()
    await page.getByLabel('zu', { exact: true }).click()
    await page.getByLabel('dem', { exact: true }).click()
    await expect(messageBar(page)).toContainText('zum')

    await page.getByLabel('Letztes Wort löschen').click()
    await expect(messageBar(page)).not.toContainText('zum')
    await expect(messageBar(page)).toContainText('Tippe Knöpfe an')
  })
})

test.describe('German word forms (§19.7)', () => {
  test('a separable verb keeps its particle and leads with the infinitive', async ({
    page,
  }) => {
    // The design decision made visible: `aufstehen` leads, because that is the
    // form that follows a modal and makes `ich will aufstehen` correct German.
    // The conjugated chunk keeps the particle attached rather than attempting
    // clause-final placement.
    await setupGermanProfile(page)
    await page.getByLabel('Tun, opens page').click()
    await longPress(page, 'aufmachen')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('aufmachen', { exact: true })).toBeVisible()
    await expect(dialog.getByText('mache auf', { exact: true })).toBeVisible()
    // …and the participle rejoins around the ge-.
    await expect(dialog.getByText('aufgemacht', { exact: true })).toBeVisible()
  })

  test('a noun offers article + noun, which is where German puts the case', async ({
    page,
  }) => {
    await setupGermanProfile(page)
    await page.getByLabel('Menschen, opens page').click()
    await longPress(page, 'Mama')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('die Mama', { exact: true })).toBeVisible()
    await expect(dialog.getByText('der Mama', { exact: true })).toBeVisible()
  })

  test('an adjective leads with the uninflected predicative form', async ({ page }) => {
    // `der Mann ist gut` takes no ending, so it is always safe after `ist` —
    // which is how most adjectives on a board actually get used.
    await setupGermanProfile(page)
    await page.getByLabel('Beschreiben, opens page').click()
    await longPress(page, 'groß')

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('größer', { exact: true })).toBeVisible()
  })
})
