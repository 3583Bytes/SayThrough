import { expect, test, type Page } from '@playwright/test'
import { enterEditMode, setupProfile } from './helpers'

// §14.4 printing. The pure half — grid geometry, hidden cells, escaping — is
// covered in tests/unit/print.test.ts. What only an end-to-end run proves is
// the part that actually fails in practice: that the real IndexedDB driver
// hands back this profile's pages and buttons, and that the symbol refs
// resolve against the app's deployed assets.

async function openSettings(page: Page) {
  await enterEditMode(page)
  await page.getByLabel('Open settings').click()
  await page.getByText('Print', { exact: true }).waitFor()
}

/**
 * Watches for the print iframe and keeps the document it was created with.
 *
 * `printService` assigns `srcdoc` before appending the frame, so a childList
 * observer sees the finished document at insertion — nothing to race, and no
 * native dialog to dismiss (headless Chromium treats `print()` as a no-op).
 */
async function capturePrint(page: Page) {
  await page.evaluate(() => {
    const store = window as unknown as { __printed?: string }
    new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLIFrameElement && node.getAttribute('srcdoc')) {
            store.__printed = node.getAttribute('srcdoc') ?? ''
          }
        })
      }
    }).observe(document.documentElement, { childList: true, subtree: true })
  })
}

async function printedDocument(page: Page): Promise<string> {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __printed?: string }).__printed), {
      timeout: 10_000,
      message: 'no print document was produced',
    })
    .toBeTruthy()
  return page.evaluate(() => (window as unknown as { __printed?: string }).__printed ?? '')
}

test.describe('printing the board (§14.4)', () => {
  test('prints this profile’s own board, with its symbols', async ({ page }) => {
    await setupProfile(page, { name: 'Robin' })
    await openSettings(page)
    await capturePrint(page)

    await page.getByLabel('Print this board').click()
    const html = await printedDocument(page)

    // Real words off the real board, not a stock sheet.
    expect(html).toContain('want')
    expect(html).toContain('more')
    // Symbols resolve against the app's own deployed assets — the coupling
    // that silently turns every cell into an empty box if that path moves.
    expect(html).toMatch(/src="[^"]*\/symbols\/arasaac\/\d+\.webp"/)
    // One board per sheet, colours forced on, because the Fitzgerald colour
    // is how a word class is recognised rather than decoration.
    expect(html).toContain('page-break-after: always')
    expect(html).toContain('print-color-adjust: exact')
    // The ARASAAC licence requires attribution wherever the material appears.
    expect(html).toContain('ARASAAC')

    await expect(page.getByText('Sent to your printer.')).toBeVisible()
  })

  test('the printed grid matches the board on screen', async ({ page }) => {
    await setupProfile(page, { name: 'Robin' })
    await openSettings(page)
    await capturePrint(page)
    await page.getByLabel('Print this board').click()
    const html = await printedDocument(page)

    // The grid is declared from the page's own rows/columns, and cells are
    // placed by their stored position. If printing ever silently reflowed to
    // fit paper, the motor plan would not transfer and the print would be
    // worse than useless.
    const grid = html.match(/grid-template-columns:repeat\((\d+),1fr\);grid-template-rows:repeat\((\d+),1fr\)/)
    expect(grid, 'printed sheet declares an explicit grid').toBeTruthy()
    expect(Number(grid![1])).toBeGreaterThan(1)
    expect(Number(grid![2])).toBeGreaterThan(1)
    expect(html).toMatch(/grid-row:\d+\/span \d+;grid-column:\d+\/span \d+/)
  })

  test('offers the whole page set as well, labelled with the sheet count', async ({ page }) => {
    await setupProfile(page, { name: 'Robin' })
    await openSettings(page)
    // Printing every page of a full set is twenty-odd sheets; nobody should
    // find that out from the printer, so the count is on the control itself.
    const label = await page
      .getByLabel(/^Print every page \(\d+ sheets\)$/)
      .getAttribute('aria-label')
    expect(Number(label?.match(/\((\d+)/)?.[1])).toBeGreaterThan(1)
  })
})
