import type { Page } from '@playwright/test'

// Completes first-run onboarding into a real profile (optionally with a
// PIN) and waits for the Core home grid. Each test starts fresh, so this
// runs at the welcome screen.
export async function setupProfile(
  page: Page,
  opts: { name?: string; pin?: string } = {},
) {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up SayThrough' }).click()
  await page.getByLabel('User name').fill(opts.name ?? 'Tester')
  if (opts.pin) {
    await page.getByLabel('Caregiver PIN', { exact: true }).fill(opts.pin)
    await page.getByLabel('Confirm caregiver PIN').fill(opts.pin)
  }
  await page.getByRole('button', { name: 'Finish setup' }).click()
  await page.getByLabel('want', { exact: true }).waitFor({ timeout: 20_000 })
}

// Enters edit mode (assumes no PIN set unless `pin` given).
export async function enterEditMode(page: Page, pin?: string) {
  await page.getByLabel('Edit mode').click()
  if (pin) {
    await page.getByLabel('PIN input').fill(pin)
    await page.getByLabel('Submit PIN').click()
  }
  await page.getByText(/^Editing: /).waitFor({ timeout: 5_000 })
}

// The message-bar tokens live region; use to assert appended words.
export function messageBar(page: Page) {
  return page.locator('[aria-live="polite"]')
}
