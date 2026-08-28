import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, messageBar, setupProfile } from './helpers'

// §19.7 Spanish. The unit tests cover the engines; these cover the thing only
// a real build can show — that choosing Spanish at setup actually produces a
// Spanish app: Spanish chrome, the Spanish board, and Spanish word forms.

/** Completes onboarding in Spanish and waits for the Vocabulario nuclear home. */
async function setupSpanishProfile(page: Page, name = 'Prueba') {
  await page.goto('/app/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up SayThrough' }).click()
  // Picking the language re-renders the rest of the form in it.
  await page.getByRole('button', { name: 'Español' }).click()
  await page.getByLabel('Nombre del usuario').fill(name)
  await page.getByRole('button', { name: 'Terminar configuración' }).click()
  await page.getByLabel('quiero', { exact: true }).waitFor({ timeout: 20_000 })
}

test.describe('Spanish setup (§19.7)', () => {
  test('choosing Español translates the rest of onboarding', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await expect(page.getByText('Who is this voice for?')).toBeVisible()

    await page.getByRole('button', { name: 'Español' }).click()

    await expect(page.getByText('¿Para quién es esta voz?')).toBeVisible()
    await expect(page.getByText('Vocabulario inicial')).toBeVisible()
    await expect(page.getByText('Who is this voice for?')).toHaveCount(0)
  })

  test('offers only Spanish boards once Spanish is chosen', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await expect(page.getByRole('button', { name: /Start with Core Vocabulary$/ })).toBeVisible()

    await page.getByRole('button', { name: 'Español' }).click()

    // §19.2: a board is authored in one language and cannot be reflowed into
    // another, so mixing them in one chooser would be a trap.
    await expect(page.getByRole('button', { name: /Empezar con Vocabulario nuclear$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Start with Core Vocabulary$/ })).toHaveCount(0)
  })

  test('lands on the Spanish board with Spanish chrome', async ({ page }) => {
    await setupSpanishProfile(page)

    // Persistent core, in Spanish — including BOTH copulas, which English has
    // only one of and which the board would be broken without.
    for (const word of ['yo', 'quiero', 'es', 'está', 'ayuda', 'no']) {
      await expect(page.getByLabel(word, { exact: true })).toBeVisible()
    }
    // Chrome follows the profile, not the browser.
    await expect(page.getByLabel('Inicio')).toBeVisible()
    await expect(page.getByLabel('Buscar en el vocabulario')).toBeVisible()
    await expect(page.getByLabel('Decir el mensaje')).toBeVisible()
  })

  test('builds and speaks a Spanish sentence', async ({ page }) => {
    await setupSpanishProfile(page)
    await page.getByLabel('yo', { exact: true }).click()
    await page.getByLabel('quiero', { exact: true }).click()
    await expect(messageBar(page)).toContainText('yo')
    await expect(messageBar(page)).toContainText('quiero')
    await page.getByLabel('Decir el mensaje').click()
    // Speaking must not clear or crash the bar.
    await expect(messageBar(page)).toContainText('quiero')
  })

  test('navigates into a Spanish topic page and back', async ({ page }) => {
    await setupSpanishProfile(page)
    await page.getByLabel('Comida, opens page').click()
    await expect(page.getByLabel('comer', { exact: true })).toBeVisible()
    // The persistent core is unchanged on the topic page (§19.6).
    await expect(page.getByLabel('quiero', { exact: true })).toBeVisible()
    await page.getByLabel('Atrás', { exact: true }).click()
    await expect(page.getByLabel('Comida, opens page')).toBeVisible()
  })
})

test.describe('Spanish word forms (§19.7)', () => {
  test('long-press a verb offers its person forms', async ({ page }) => {
    await setupSpanishProfile(page)
    await page.getByLabel('Acciones, opens page').click()
    const verb = page.getByLabel('abrir', { exact: true })
    await verb.waitFor()

    // Long-press opens the forms popup.
    const box = (await verb.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()

    await expect(page.getByText('Formas de «abrir»')).toBeVisible()
    // Spanish is pro-drop: person lives on the verb, so these are the forms
    // that matter and the English engine would never produce them.
    await expect(page.getByLabel('Insertar abro', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Insertar abres', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Insertar abrimos', { exact: true })).toBeVisible()

    await page.getByLabel('Insertar abro', { exact: true }).click()
    await expect(messageBar(page)).toContainText('abro')
  })

  test('an adjective agrees with the noun already in the bar', async ({ page }) => {
    await setupSpanishProfile(page)

    // Put a feminine noun in the message bar first.
    await page.getByLabel('Comida, opens page').click()
    await page.getByLabel('galleta', { exact: true }).click()
    await expect(messageBar(page)).toContainText('galleta')
    await page.getByLabel('Atrás', { exact: true }).click()

    await page.getByLabel('Describir, opens page').click()
    const adjective = page.getByLabel('pequeño', { exact: true })
    await adjective.waitFor()
    const box = (await adjective.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()

    // Agreement is what makes Spanish structurally different: the correct
    // form depends on another word, so the feminine leads and says so.
    await expect(page.getByLabel('Insertar pequeña', { exact: true })).toBeVisible()
    await page.getByLabel('Insertar pequeña', { exact: true }).click()
    await expect(messageBar(page)).toContainText('pequeña')
  })
})

test.describe('switching language (§19.7)', () => {
  test('moves an existing profile onto the Spanish board', async ({ page }) => {
    await setupProfile(page)
    await expect(page.getByLabel('want', { exact: true })).toBeVisible()

    await enterEditMode(page)
    await page.getByLabel('Open settings').click()
    await page.getByRole('button', { name: 'Español' }).click()

    // Settings itself re-renders in Spanish immediately. Asserted on the back
    // button rather than the "Ajustes" heading, which also matches the (now
    // hidden) edit bar behind this screen.
    await expect(page.getByLabel('Volver a la comunicación')).toBeVisible()
    await expect(page.getByText('Perfil').first()).toBeVisible()
    await page.getByLabel('Volver a la comunicación').click()
    await page.getByLabel('Terminar de editar').click()

    // ...and the board is the Spanish one, at the same grid size.
    await expect(page.getByLabel('quiero', { exact: true })).toBeVisible()
    await expect(page.getByLabel('want', { exact: true })).toHaveCount(0)
  })
})
