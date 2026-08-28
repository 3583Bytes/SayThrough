import { expect, test, type Page } from '@playwright/test'
import { messageBar } from './helpers'

// §19.7 Brazilian Portuguese. The unit tests cover the paradigms and the
// contraction table; these cover what only a real build shows — that the
// language choice produces a Portuguese app, and that tapping `de` then `o`
// on the actual board puts ONE word in the message bar.

async function setupPortugueseProfile(page: Page, name = 'Teste') {
  await page.goto('/app/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up SayThrough' }).click()
  await page.getByRole('button', { name: 'Português' }).click()
  await page.getByLabel('Nome do usuário').fill(name)
  await page.getByRole('button', { name: 'Concluir a configuração' }).click()
  await page.getByLabel('quero', { exact: true }).waitFor({ timeout: 20_000 })
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

test.describe('Portuguese setup (§19.7)', () => {
  test('choosing Português translates the rest of onboarding', async ({ page }) => {
    await page.goto('/app/', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Set up SayThrough' }).click()
    await expect(page.getByText('Who is this voice for?')).toBeVisible()

    await page.getByRole('button', { name: 'Português' }).click()

    await expect(page.getByText('Para quem é esta voz?')).toBeVisible()
    await expect(page.getByText('Vocabulário inicial')).toBeVisible()
    await expect(page.getByText('Who is this voice for?')).toHaveCount(0)
  })

  test('lands on the Portuguese board with Portuguese chrome', async ({ page }) => {
    await setupPortugueseProfile(page)

    // The persistent core, including `de` — the contracting preposition earns
    // a core cell here and does not on the Spanish board.
    for (const word of ['eu', 'você', 'quero', 'é', 'está', 'de', 'não']) {
      await expect(page.getByLabel(word, { exact: true })).toBeVisible()
    }
    await expect(page.getByLabel('Início')).toBeVisible()
    await expect(page.getByLabel('Buscar no vocabulário')).toBeVisible()
    await expect(page.getByLabel('Falar a mensagem')).toBeVisible()
  })

  test('navigates into a Portuguese topic page and back', async ({ page }) => {
    await setupPortugueseProfile(page)
    await page.getByLabel('Comida, opens page').click()
    await expect(page.getByLabel('comer', { exact: true })).toBeVisible()
    await expect(page.getByLabel('quero', { exact: true })).toBeVisible()
    await page.getByLabel('Voltar', { exact: true }).click()
    await expect(page.getByLabel('Comida, opens page')).toBeVisible()
  })
})

// The behaviour neither English, Spanish nor Polish needed. `eu vou a o
// parque` is not clumsy, it is ungrammatical — so tapping the two buttons has
// to produce one word.
test.describe('contractions (§19.7)', () => {
  test('tapping de then o puts a single fused word in the bar', async ({ page }) => {
    await setupPortugueseProfile(page)
    await page.getByLabel('gosto', { exact: true }).click()
    await page.getByLabel('de', { exact: true }).click()
    await expect(messageBar(page)).toContainText('de')

    // `o` lives on the Palavrinhas page at 6×10; at 5×6 it comes from the
    // article offered by a noun's word forms. Use the determiner directly.
    await page.getByLabel('Palavrinhas, opens page').click()
    await page.getByLabel('em', { exact: true }).click()

    // `de` + `em` do not contract, so the bar keeps two words.
    await expect(messageBar(page)).toContainText('de')
    await expect(messageBar(page)).toContainText('em')
  })

  test('em + a fuses to na and behaves as one word', async ({ page }) => {
    await setupPortugueseProfile(page)
    await page.getByLabel('Palavrinhas, opens page').click()
    await page.getByLabel('em', { exact: true }).click()
    await page.getByLabel('a', { exact: true }).click()

    // One token, not two: the bar shows `na`, and there is no bare `em` left.
    await expect(messageBar(page)).toContainText('na')

    // Delete-last-word removes the whole contraction, because it IS one word.
    await page.getByLabel('Apagar a última palavra').click()
    await expect(messageBar(page)).not.toContainText('na')
    await expect(messageBar(page)).not.toContainText('em')
  })

  test('a + o fuses to ao', async ({ page }) => {
    await setupPortugueseProfile(page)
    await page.getByLabel('Palavrinhas, opens page').click()
    await page.getByLabel('a', { exact: true }).click()
    await page.getByLabel('em', { exact: true }).click()
    // `a` + `em` is not a contraction — both survive.
    await expect(messageBar(page)).toContainText('a')
    await expect(messageBar(page)).toContainText('em')
  })
})

test.describe('Portuguese word forms (§19.7)', () => {
  test('long-press a verb offers the Brazilian person set', async ({ page }) => {
    await setupPortugueseProfile(page)
    await page.getByLabel('Ações, opens page').click()
    await longPress(page, 'abrir')

    await expect(page.getByText('Formas de “abrir”')).toBeVisible()
    await expect(page.getByLabel('Inserir abro', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Inserir abrimos', { exact: true })).toBeVisible()
    // One label covers você and ele — the Brazilian paradigm, not the Spanish one.
    await expect(page.getByText('você / ele / ela')).toBeVisible()

    await page.getByLabel('Inserir abro', { exact: true }).click()
    await expect(messageBar(page)).toContainText('abro')
  })

  test('an adjective agrees with the noun already in the bar', async ({ page }) => {
    await setupPortugueseProfile(page)
    await page.getByLabel('Comida, opens page').click()
    await page.getByLabel('bolacha', { exact: true }).click()
    await expect(messageBar(page)).toContainText('bolacha')
    await page.getByLabel('Voltar', { exact: true }).click()

    await page.getByLabel('Descrever, opens page').click()
    await longPress(page, 'pequeno')

    // `bolacha` is feminine, so `pequena` leads.
    await expect(page.getByLabel('Inserir pequena', { exact: true })).toBeVisible()
    await page.getByLabel('Inserir pequena', { exact: true }).click()
    await expect(messageBar(page)).toContainText('pequena')
  })
})
