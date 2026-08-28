import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, setupProfile } from './helpers'
import { AUDIT, type Issue } from './contrastAudit'

async function expectReadable(page: Page, where: string) {
  const issues = (await page.evaluate(AUDIT)) as Issue[]
  const seen = new Set<string>()
  const unique = issues.filter((i) => !seen.has(i.text + i.fg) && seen.add(i.text + i.fg))
  expect(
    unique,
    `${where}: text below WCAG AA —\n` +
      unique.map((i) => `  ${i.ratio}:1 (needs ${i.min}) "${i.text}"  fg=${i.fg} on ${i.bg}`).join('\n'),
  ).toEqual([])
}

async function openSettings(page: Page) {
  await enterEditMode(page)
  await page.getByLabel('Open settings').click()
  await page.getByText('Appearance').waitFor()
}

test('light mode text meets WCAG AA', async ({ page }) => {
  test.setTimeout(180_000)
  await setupProfile(page)
  await expectReadable(page, 'Board (light)')
  await openSettings(page)
  await expectReadable(page, 'Settings (light)')
})

test('dark mode text meets WCAG AA', async ({ page }) => {
  test.setTimeout(180_000)
  await setupProfile(page)
  await openSettings(page)
  await page.getByLabel('Dark', { exact: true }).click()
  await page.waitForTimeout(400)
  await expectReadable(page, 'Settings (dark)')

  await page.getByLabel('Back to communication').click()
  await expectReadable(page, 'Edit mode (dark)')
  await page.getByLabel('Done editing').click()
  await expectReadable(page, 'Board (dark)')

  await page.getByRole('button', { name: 'Search vocabulary' }).click()
  await page.getByRole('textbox', { name: 'Search vocabulary' }).fill('happy')
  await page.waitForTimeout(300)
  await expectReadable(page, 'Search (dark)')
  await page.getByLabel('Close search').click()

  await page.getByLabel('Message actions').click()
  await page.waitForTimeout(300)
  await expectReadable(page, 'Message actions (dark)')
  await page.keyboard.press('Escape')

  // The button editor is the densest screen in the app and the one most
  // likely to regress — it is built from sub-components with their own styles.
  await page.getByLabel('Edit mode').click()
  await page.getByText(/^Editing: /).waitFor()
  await page.getByLabel('want', { exact: true }).click()
  await page.getByLabel('want', { exact: true }).click()
  await page.waitForTimeout(400)
  await expectReadable(page, 'Button editor (dark)')
  await page.keyboard.press('Escape')

  // The page menu, on a topic page so its destructive Delete row is present.
  // This popup was one of the two screens the dark-on-dark labels were
  // reported on, so it stays covered by name.
  await page.getByLabel('Food, opens page').click()
  await page.getByLabel('Page options').click()
  await page.getByText(/^Page: /).waitFor()
  await expectReadable(page, 'Page menu (dark)')
})
