import { UI_COLORS } from '../constants/colors'
import { storage } from '../storage'
import type { Button, Page } from '../types/models'
import { uuid } from '../utils/uuid'

// Page lifecycle for user-created pages. Pages are created ONLY via
// button-linking ("This button opens…"), so orphan pages can't exist by
// construction (§4.11.4 becomes moot for user content).

// Creates a page in the set; when includeCoreRegion is set, copies the
// root page's buttons in columns 0–2 — the §19.2 persistent core region —
// so the motor-plan invariant (§19.6) holds on user-created pages too.
export async function createLinkedPage(
  pageSetId: string,
  name: string,
  includeCoreRegion: boolean,
): Promise<Page> {
  const pageSet = await storage.getPageSet(pageSetId)
  if (!pageSet) throw new Error('Page set not found')

  const now = Date.now()
  const rootPage = await storage.getPage(pageSet.rootPageId)
  const page: Page = {
    id: uuid(),
    pageSetId,
    name,
    rows: rootPage?.rows ?? 5,
    columns: rootPage?.columns ?? 6,
    backgroundColor: '#FFFFFF',
    showMessageBar: true,
    showToolbar: true,
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
  }
  await storage.createPage(page)

  if (includeCoreRegion && rootPage) {
    const rootButtons = await storage.getButtonsForPage(rootPage.id)
    for (const template of rootButtons.filter((b) => b.column <= 2)) {
      const copy: Button = {
        ...template,
        id: uuid(),
        pageId: page.id,
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
      }
      await storage.createButton(copy)
    }
  }

  // Every sub-page is reachable only by linking, so it always has a page to
  // return to — give it an in-grid Back button at the first content cell,
  // matching built-in topic pages (§19.6: fixed position, never shifts).
  await storage.createButton({
    id: uuid(),
    pageId: page.id,
    row: 0,
    column: includeCoreRegion ? 3 : 0,
    rowSpan: 1,
    columnSpan: 1,
    label: 'Back',
    backgroundColor: '#ECEFF1',
    borderColor: UI_COLORS.buttonBorder,
    borderWidth: 1,
    labelColor: UI_COLORS.label,
    labelFontSize: 14,
    labelFontWeight: 'bold',
    symbolScale: 0.65,
    isHidden: false,
    isNavigationButton: false,
    actions: [{ type: 'navigate_back' }],
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
  })

  return page
}

export async function renamePage(page: Page, name: string): Promise<void> {
  await storage.updatePage({ ...page, name, updatedAt: Date.now() })
}

// Deletes a page and repairs every button that linked to it (back to a
// plain speak/append button). The root page can never be deleted.
export async function deletePageAndCleanLinks(page: Page): Promise<void> {
  const pageSet = await storage.getPageSet(page.pageSetId)
  if (pageSet?.rootPageId === page.id) {
    throw new Error('The home page cannot be deleted')
  }

  await storage.deletePage(page.id)

  const pages = await storage.getPagesForPageSet(page.pageSetId)
  for (const other of pages) {
    for (const button of await storage.getButtonsForPage(other.id)) {
      const linksHere = button.actions.some(
        (action) => action.type === 'navigate' && action.pageId === page.id,
      )
      if (!linksHere) continue
      await storage.updateButton({
        ...button,
        isNavigationButton: false,
        actions: [{ type: 'append_to_message' }],
        updatedAt: Date.now(),
      })
    }
  }
}
