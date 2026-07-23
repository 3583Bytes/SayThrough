import type { Button, Page, PageSet } from '../types/models'

// Repository interface — technical-specification.md §8. The schema and
// models are identical across platforms; only the driver differs:
// createStorage.ts (native, expo-sqlite) vs createStorage.web.ts
// (IndexedDB — expo-sqlite's web build is alpha and needs COOP/COEP
// headers that static hosts like GitHub Pages cannot set).
export interface Storage {
  init(): Promise<void>

  // Wipe everything — dev reseeds and the future "reset app" setting
  clearAll(): Promise<void>

  // meta key-value (extraction flags, active ids, …)
  getMeta(key: string): Promise<string | null>
  setMeta(key: string, value: string): Promise<void>

  getPageSets(): Promise<PageSet[]>
  getPageSet(id: string): Promise<PageSet | null>
  createPageSet(pageSet: PageSet): Promise<void>

  getPage(id: string): Promise<Page | null>
  getPagesForPageSet(pageSetId: string): Promise<Page[]>
  createPage(page: Page): Promise<void>

  getButtonsForPage(pageId: string): Promise<Button[]>
  createButton(button: Button): Promise<void>
  updateButton(button: Button): Promise<void>
  deleteButton(id: string): Promise<void>
}
